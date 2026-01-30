"""
OAuth авторизация через Яндекс ID
"""
import json
import os
import psycopg2
import urllib.request
import urllib.parse
from datetime import datetime

def get_db_connection():
    """Подключение к базе данных"""
    dsn = os.environ['DATABASE_URL']
    return psycopg2.connect(dsn)

def get_schema():
    """Получение имени схемы"""
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def handler(event: dict, context) -> dict:
    """Обработчик OAuth авторизации через Яндекс"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        if method == 'POST':
            # Обмен кода на токен и получение данных пользователя
            body = json.loads(event.get('body', '{}'))
            code = body.get('code')
            user_id = body.get('user_id')  # ID пользователя для привязки
            
            if not code:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Код авторизации обязателен'}),
                    'isBase64Encoded': False
                }
            
            client_id = os.environ.get('YANDEX_CLIENT_ID')
            client_secret = os.environ.get('YANDEX_CLIENT_SECRET')
            
            if not client_id or not client_secret:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Яндекс OAuth не настроен'}),
                    'isBase64Encoded': False
                }
            
            # Обмен кода на токен
            token_data = urllib.parse.urlencode({
                'grant_type': 'authorization_code',
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret
            }).encode()
            
            token_req = urllib.request.Request(
                'https://oauth.yandex.ru/token',
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            with urllib.request.urlopen(token_req) as response:
                token_response = json.loads(response.read().decode())
            
            access_token = token_response.get('access_token')
            
            if not access_token:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Не удалось получить токен'}),
                    'isBase64Encoded': False
                }
            
            # Получение данных пользователя
            user_req = urllib.request.Request(
                'https://login.yandex.ru/info?format=json',
                headers={'Authorization': f'OAuth {access_token}'}
            )
            
            with urllib.request.urlopen(user_req) as response:
                yandex_user = json.loads(response.read().decode())
            
            yandex_id = yandex_user.get('id')
            yandex_email = yandex_user.get('default_email')
            first_name = yandex_user.get('first_name', '')
            last_name = yandex_user.get('last_name', '')
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            try:
                schema = get_schema()
                if user_id:
                    # Привязка Яндекс к существующему аккаунту
                    cur.execute(
                        f"UPDATE {schema}.users SET yandex_id = %s, yandex_email = %s, updated_at = %s WHERE id = %s RETURNING id, phone, first_name, last_name",
                        (yandex_id, yandex_email, datetime.now(), user_id)
                    )
                    user = cur.fetchone()
                    conn.commit()
                    
                    if not user:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Пользователь не найден'}),
                            'isBase64Encoded': False
                        }
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'user_id': user[0],
                            'phone': user[1],
                            'first_name': user[2],
                            'last_name': user[3],
                            'yandex_email': yandex_email,
                            'message': 'Яндекс ID успешно привязан'
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    # Проверяем есть ли уже пользователь с таким Яндекс ID
                    cur.execute(
                        f"SELECT id, phone, first_name, last_name, ai_responses_enabled FROM {schema}.users WHERE yandex_id = %s",
                        (yandex_id,)
                    )
                    user = cur.fetchone()
                    
                    if user:
                        # Вход через Яндекс
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({
                                'user_id': user[0],
                                'phone': user[1],
                                'first_name': user[2],
                                'last_name': user[3],
                                'yandex_email': yandex_email,
                                'ai_responses_enabled': user[4],
                                'message': 'Вход через Яндекс выполнен'
                            }),
                            'isBase64Encoded': False
                        }
                    else:
                        # Регистрация через Яндекс (без телефона)
                        cur.execute(
                            f"INSERT INTO {schema}.users (phone, first_name, last_name, yandex_id, yandex_email) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                            (f'yandex_{yandex_id}', first_name, last_name, yandex_id, yandex_email)
                        )
                        new_user_id = cur.fetchone()[0]
                        conn.commit()
                        
                        return {
                            'statusCode': 201,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({
                                'user_id': new_user_id,
                                'first_name': first_name,
                                'last_name': last_name,
                                'yandex_email': yandex_email,
                                'yandex_connected': True,
                                'ai_responses_enabled': False,
                                'message': 'Регистрация через Яндекс успешна'
                            }),
                            'isBase64Encoded': False
                        }
            finally:
                cur.close()
                conn.close()
        
        elif method == 'GET':
            # Генерация URL для авторизации
            client_id = os.environ.get('YANDEX_CLIENT_ID')
            
            if not client_id:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Яндекс OAuth не настроен'}),
                    'isBase64Encoded': False
                }
            
            # Callback URL будет настроен в Яндекс.OAuth
            auth_url = f'https://oauth.yandex.ru/authorize?response_type=code&client_id={client_id}'
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'auth_url': auth_url}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }