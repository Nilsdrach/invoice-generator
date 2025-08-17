exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Netlify Functions funktionieren!",
      timestamp: new Date().toISOString(),
      event: event.httpMethod
    })
  };
};

