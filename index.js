const https = require('https');
const host = 'www.puregym.com';

const options = {
  method: 'GET',
  host,
  path: '/login/',
  headers: {
    Cookie: '',
  },
};

const req = https.request(options, (res) => {
  if (res.statusCode < 400) {
    const data = [];

    res.on('data', (chunk) => {
      data.push(chunk);
    });

    res.on('end', () => {
      const fullData = data.join('');
      const tokenRegex = /<form id="__AjaxAntiForgeryForm"(?:.*)value="((\w|-)+)"(?:.*)<\/form>/;
      const matches = fullData.match(tokenRegex);

      if (matches && matches.length) {
        const requestToken = matches[1];
        const cookies = res.headers['set-cookie']
          .map((cookie) => {
            return cookie.split('; ')[0];
          })
          .join('; ');

        logIn({ loginCookies: cookies, requestToken });
      }
    });
  }
});

req.end();

function logIn({ loginCookies, requestToken }) {
  const formData = {
    email: process.argv[2],
    pin: process.argv[3],
  };

  const options = {
    method: 'POST',
    host,
    path: '/api/members/login/',
    headers: {
      'Content-Type': 'application/json',
      __requestVerificationToken: requestToken,
      Cookie: `${loginCookies}; __RequestVerificationToken=${requestToken}`,
    },
  };

  const req = https.request(options, (res) => {
    if (res.statusCode < 400) {
      const data = [];

      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        const cookies = res.headers['set-cookie']
          .map((cookie) => {
            return cookie.split('; ')[0];
          })
          .join('; ');

        getMembersPage({
          loginCookies,
          apiCookies: cookies,
          requestToken,
        });
      });
    }
  });

  req.write(JSON.stringify(formData));
  req.end();
}

function getMembersPage({ loginCookies, apiCookies, requestToken }) {
  const options = {
    method: 'GET',
    host,
    path: '/members/',
    headers: {
      cookie: `${loginCookies}; ${apiCookies}; __RequestVerificationToken=${requestToken}`,
    },
  };

  const req = https.request(options, (res) => {
    const data = [];

    res.on('data', (chunk) => {
      data.push(chunk);
    });

    res.on('end', () => {
      const fullData = data.join('');
      const memberRegex = /(\d+) people/;
      const matches = fullData.match(memberRegex);

      if (matches && matches.length) {
        console.log(`Currently there are ${matches[1]} people at the gym.`);
      }
    });
  });

  req.end();
}
