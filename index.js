const https = require('https');

const pageOptions = {
  method: 'GET',
  host: 'www.puregym.com',
  path: '/login/',
};

const pageReq = https.request(pageOptions, (pageRes) => {
  if (pageRes.statusCode < 400) {
    const data = [];

    pageRes.on('data', function(chunk) {
      data.push(chunk);
    });

    pageRes.on('end', () => {
      const fullData = data.join('');
      const regex = /<form id="__AjaxAntiForgeryForm"(?:.*)value="((\w|-)+)"(?:.*)<\/form>/;
      const matches = fullData.match(regex);

      if (matches && matches.length > 0) {
        const requestToken = matches[1];
        console.log(`requestToken`, requestToken);
      }
    });
  }
});

pageReq.end();
