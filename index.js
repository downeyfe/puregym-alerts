const https = require('https');

const pageOptions = {
  method: 'GET',
  host: 'www.puregym.com',
  path: '/login/',
  headers: {
    Cookie: '',
  },
};

const pageReq = https.request(pageOptions, (pageRes) => {
  if (pageRes.statusCode < 400) {
    const pageData = [];

    pageRes.on('data', (chunk) => {
      pageData.push(chunk);
    });

    pageRes.on('end', () => {
      const fullData = pageData.join('');
      const regex = /<form id="__AjaxAntiForgeryForm"(?:.*)value="((\w|-)+)"(?:.*)<\/form>/;
      const matches = fullData.match(regex);

      if (matches && matches.length) {
        const requestToken = matches[1];
        const pageCookies = pageRes.headers['set-cookie']
          .map((cookie) => {
            return cookie.split('; ')[0];
          })
          .join('; ');
        const formData = {
          email: process.argv[2],
          pin: process.argv[3],
        };

        const apiOptions = {
          method: 'POST',
          host: 'www.puregym.com',
          path: '/api/members/login/',
          headers: {
            'Content-Type': 'application/json',
            __requestVerificationToken: requestToken,
            Cookie: `${pageCookies}; __RequestVerificationToken=${requestToken}`,
          },
        };

        const apiReq = https.request(apiOptions, (apiRes) => {
          const apiData = [];

          apiRes.on('data', (chunk) => {
            apiData.push(chunk);
          });

          apiRes.on('end', () => {
            const apiCookies = apiRes.headers['set-cookie']
              .map((cookie) => {
                return cookie.split('; ')[0];
              })
              .join('; ');

            if (apiRes.statusCode < 400) {
              const membersOptions = {
                method: 'GET',
                host: 'www.puregym.com',
                path: '/members/',
                headers: {
                  cookie: `${pageCookies}; ${apiCookies}; __RequestVerificationToken=${requestToken}`,
                },
              };

              const membersReq = https.request(membersOptions, (membersRes) => {
                const membersData = [];

                membersRes.on('data', (chunk) => {
                  membersData.push(chunk);
                });

                membersRes.on('end', () => {
                  const fullData = membersData.join('');
                  const memberRegex = /(\d+) people/;
                  const result = fullData.match(memberRegex);

                  if (result && result.length) {
                    console.log(`result`, result[1]);
                  }

                });
              });

              membersReq.end();
            }
          });
        });

        apiReq.write(JSON.stringify(formData));

        apiReq.end();
      }
    });
  }
});

pageReq.end();
