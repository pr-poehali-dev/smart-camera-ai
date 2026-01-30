"""
API для сканирования объектов через камеру с AI-распознаванием (OpenAI Vision)
"""
import json
import os
import psycopg2
import base64
from datetime import datetime
import urllib.request

def get_db_connection():
    """Подключение к базе данных"""
    dsn = os.environ['DATABASE_URL']
    return psycopg2.connect(dsn)

def get_schema():
    """Получение имени схемы"""
    return os.environ.get('MAIN_DB_SCHEMA', 'public')

def analyze_image(image_base64: str, ai_responses_enabled: bool) -> dict:
    """Анализ изображения через OpenAI Vision API"""
    api_key = os.environ.get('OPENAI_API_KEY')
    
    if not api_key:
        raise Exception('OpenAI API ключ не настроен')
    
    # Базовый промпт для распознавания
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Проанализируй это изображение. Определи основной объект на фото. Ответ дай в формате JSON: {\"title\": \"название объекта\", \"category\": \"категория\", \"confidence\": число от 0 до 100}. Категории: Фрукты, Овощи, Животные, Электроника, Транспорт, Одежда, Мебель, Растения, Еда, Другое."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"
                    }
                }
            ]
        }
    ]
    
    # Если включены AI-ответы, добавляем детальное описание
    if ai_responses_enabled:
        messages.append({
            "role": "user",
            "content": "Также добавь поле 'description' с подробным описанием объекта (2-3 предложения)."
        })
    
    request_data = json.dumps({
        "model": "gpt-4o-mini",
        "messages": messages,
        "max_tokens": 300
    }).encode()
    
    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=request_data,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
    )
    
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode())
    
    content = result['choices'][0]['message']['content']
    
    # Извлекаем JSON из ответа
    if '```json' in content:
        content = content.split('```json')[1].split('```')[0].strip()
    elif '```' in content:
        content = content.split('```')[1].split('```')[0].strip()
    
    return json.loads(content)

def handler(event: dict, context) -> dict:
    """Обработчик сканирования объектов"""
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
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'POST':
            # Сканирование нового изображения
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            image_base64 = body.get('image')
            
            if not user_id or not image_base64:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id и image обязательны'}),
                    'isBase64Encoded': False
                }
            
            # Получаем настройки пользователя
            schema = get_schema()
            cur.execute(f"SELECT ai_responses_enabled FROM {schema}.users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            ai_responses_enabled = user[0]
            
            # Анализ изображения через OpenAI Vision
            analysis = analyze_image(image_base64, ai_responses_enabled)
            
            # Сохранение в историю
            cur.execute(
                f"""
                INSERT INTO {schema}.scan_history 
                (user_id, title, category, confidence, ai_response, created_at) 
                VALUES (%s, %s, %s, %s, %s, %s) 
                RETURNING id, created_at
                """,
                (
                    user_id,
                    analysis.get('title', 'Неизвестный объект'),
                    analysis.get('category', 'Другое'),
                    analysis.get('confidence', 50),
                    analysis.get('description'),
                    datetime.now()
                )
            )
            scan_id, created_at = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'scan_id': scan_id,
                    'title': analysis.get('title'),
                    'category': analysis.get('category'),
                    'confidence': analysis.get('confidence'),
                    'description': analysis.get('description') if ai_responses_enabled else None,
                    'created_at': created_at.isoformat()
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'GET':
            # Получение истории сканирований
            user_id = event.get('queryStringParameters', {}).get('user_id')
            limit = int(event.get('queryStringParameters', {}).get('limit', 20))
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            schema = get_schema()
            cur.execute(
                f"""
                SELECT id, title, category, confidence, ai_response, created_at 
                FROM {schema}.scan_history 
                WHERE user_id = %s 
                ORDER BY created_at DESC 
                LIMIT %s
                """,
                (user_id, limit)
            )
            
            scans = []
            for row in cur.fetchall():
                scans.append({
                    'id': row[0],
                    'title': row[1],
                    'category': row[2],
                    'confidence': row[3],
                    'description': row[4],
                    'created_at': row[5].isoformat()
                })
            
            # Статистика
            cur.execute(
                f"SELECT COUNT(*), AVG(confidence) FROM {schema}.scan_history WHERE user_id = %s",
                (user_id,)
            )
            stats = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'scans': scans,
                    'total_scans': stats[0] or 0,
                    'average_confidence': round(stats[1] or 0)
                }),
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