"""
API для авторизации пользователей: регистрация по телефону, вход, управление сессиями
"""
import json
import os
import psycopg2
from datetime import datetime

def get_db_connection():
    """Подключение к базе данных"""
    dsn = os.environ['DATABASE_URL']
    return psycopg2.connect(dsn)

def get_schema():
    """Получение имени схемы"""
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def handler(event: dict, context) -> dict:
    """Обработчик запросов авторизации"""
    method = event.get('httpMethod', 'GET')
    
    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'POST':
            # Регистрация или вход по телефону
            body = json.loads(event.get('body', '{}'))
            phone = body.get('phone', '').strip()
            first_name = body.get('first_name', '').strip()
            last_name = body.get('last_name', '').strip()
            
            if not phone:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Телефон обязателен'}),
                    'isBase64Encoded': False
                }
            
            # Проверяем существует ли пользователь
            schema = get_schema()
            cur.execute(f"SELECT id, phone, first_name, last_name, yandex_id, ai_responses_enabled FROM {schema}.users WHERE phone = %s", (phone,))
            user = cur.fetchone()
            
            if user:
                # Пользователь существует - вход
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'user_id': user[0],
                        'phone': user[1],
                        'first_name': user[2],
                        'last_name': user[3],
                        'yandex_connected': user[4] is not None,
                        'ai_responses_enabled': user[5],
                        'message': 'Вход выполнен'
                    }),
                    'isBase64Encoded': False
                }
            else:
                # Новый пользователь - регистрация
                cur.execute(
                    f"INSERT INTO {schema}.users (phone, first_name, last_name) VALUES (%s, %s, %s) RETURNING id",
                    (phone, first_name, last_name)
                )
                user_id = cur.fetchone()[0]
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'user_id': user_id,
                        'phone': phone,
                        'first_name': first_name,
                        'last_name': last_name,
                        'yandex_connected': False,
                        'ai_responses_enabled': False,
                        'message': 'Регистрация успешна'
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            # Получение данных пользователя
            user_id = event.get('queryStringParameters', {}).get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            schema = get_schema()
            cur.execute(
                f"SELECT id, phone, first_name, last_name, yandex_id, yandex_email, ai_responses_enabled FROM {schema}.users WHERE id = %s",
                (user_id,)
            )
            user = cur.fetchone()
            
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
                    'yandex_connected': user[4] is not None,
                    'yandex_email': user[5],
                    'ai_responses_enabled': user[6]
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            # Обновление настроек пользователя
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            ai_responses_enabled = body.get('ai_responses_enabled')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            if ai_responses_enabled is not None:
                schema = get_schema()
                cur.execute(
                    f"UPDATE {schema}.users SET ai_responses_enabled = %s, updated_at = %s WHERE id = %s",
                    (ai_responses_enabled, datetime.now(), user_id)
                )
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Настройки обновлены'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()