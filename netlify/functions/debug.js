exports.handler = async function(event, context) {
  console.log('Debug function called');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: JSON.stringify({
      message: "Debug function funktioniert!",
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path,
      headers: event.headers,
      body: event.body ? JSON.parse(event.body) : null
    })
  };
};


