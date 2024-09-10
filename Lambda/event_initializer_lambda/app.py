import json
import boto3
from datetime import datetime, timedelta
import base64
import uuid
import pytz

def convert_timezone(input_date, input_format):

  # Convert string to datetime object
  input_datetime = datetime.fromisoformat(input_date)

  # Define the timezone
  input_timezone = pytz.timezone(input_format)

  # Localize the datetime object to the input timezone
  localized_datetime = input_timezone.localize(input_datetime)

  # Convert to UTC
  utc_datetime = localized_datetime.astimezone(pytz.utc)

  # Format the UTC datetime as a string
  utc_datetime_str = utc_datetime.strftime('%Y-%m-%dT%H:%M:%S')

  return utc_datetime_str
  

def calculate_trigger_count(start_datetime_str, end_datetime_str, frequency_minutes):
    # Convert start and end date times from strings to datetime objects
    start_datetime = datetime.strptime(start_datetime_str, '%Y-%m-%dT%H:%M:%S')
    end_datetime = datetime.strptime(end_datetime_str, '%Y-%m-%dT%H:%M:%S')

    # Calculate the time difference between start and end date times
    time_difference = end_datetime - start_datetime

    # Convert the time difference to minutes
    total_minutes = time_difference.total_seconds() / 60

    # Calculate the number of triggers
    trigger_count = total_minutes // frequency_minutes

    return int(trigger_count) + 1

def create_event_rule(id, start_date_time_str):
    # Calculate the time 1 minute before start_date_time
    start_date_time = datetime.strptime(start_date_time_str, "%Y-%m-%dT%H:%M:%S")
    trigger_time = start_date_time - timedelta(minutes=1)
    

    # Create EventBridge rule with a cron expression for the trigger time
    events_client = boto3.client('events')
    rule_name = f'TriggerBeforeStart_{id}'
    response = events_client.put_rule(
        Name=rule_name,
        ScheduleExpression=f"cron({trigger_time.minute} {trigger_time.hour} {trigger_time.day} {trigger_time.month} ? {trigger_time.year})",
        State='ENABLED'
    )
    
    # Add the Lambda function as a target to the rule
    target_response = events_client.put_targets(
        Rule=rule_name,
        Targets=[
            {
                'Id': id,
                'Arn': 'arn:aws:lambda:eu-north-1:590183706685:function:event_schedulizer_lambda',
                'Input': json.dumps({'id': id}) # Optional input data for the Lambda function
            }
        ]
    )
    # Lambda invoke permission
    lambda_client = boto3.client('lambda')
    lambda_client.add_permission(
        FunctionName='event_schedulizer_lambda',
        StatementId=rule_name + '-EventBridge',
        Action='lambda:InvokeFunction',
        Principal='events.amazonaws.com',
        SourceArn=response['RuleArn']
    )
    
    return response, target_response

def lambda_handler(event, context):
    # Extract start_date_time from the request payload
    print(event)
    request_body = event
    start_date_time_str = request_body['start_date_time'].split('.')[0]
    end_date_time_str = request_body['end_date_time'].split('.')[0]
    encoded_csv_data = request_body['file']
    frequency = request_body['frequency']
    transport_mode = request_body['transport_mode'] 
    timezone = request_body['timezone'] 
    print(f'timezone:{timezone}')
    if timezone != 'UTC':
        start_date_time_str = convert_timezone(start_date_time_str, timezone)
        end_date_time_str = convert_timezone(end_date_time_str, timezone)
  
    # Decode Base64-encoded CSV data
    # csv_data_bytes = base64.b64decode(encoded_csv_data)
    
    # Decode bytes to string assuming UTF-8 encoding
    csv_data_string = encoded_csv_data
    
    # Generate a random UUID
    id = str(uuid.uuid4())
    print(f"ID : {id}")
    
    total_trigger = calculate_trigger_count(start_date_time_str, end_date_time_str, frequency)
    
    item = {
            'id': id,
            'distance_key_pair': csv_data_string,
            'event_start_time': start_date_time_str,
            'event_end_time' : end_date_time_str,
            'frequency' : frequency,
            "transport_mode" : transport_mode,
            "current_trigger_count" : 0,
            "total_trigger_count" : total_trigger,
            "timezone" : timezone
        }
    # Store in DynamoDB
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('Event_Data')
    table.put_item(
        Item= item
    )
    
    #Creating event rule
    response, target_response = create_event_rule(id, start_date_time_str)
    
    # Handle any errors that may occur during the rule creation process
    if response['ResponseMetadata']['HTTPStatusCode'] != 200 or target_response['ResponseMetadata']['HTTPStatusCode'] != 200:
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Error creating EventBridge rule', 'id' : id}),
            "headers": {
                'Content-Type' : 'application/json',
                'Access-Control-Allow-Origin' : '*',
                'Access-Control-Allow-Methods' : '*',
                'Access-Control-Allow-Headers' : '*'
            }
        }
    
    # Return a success response
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'EventBridge rule created successfully', 'id' : id}),
        "headers": {
                'Content-Type' : 'application/json', 
                'Access-Control-Allow-Origin' : '*',
                'Access-Control-Allow-Methods' : '*',
                'Access-Control-Allow-Headers' : '*'
            }
    }
