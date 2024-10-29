/* eslint-disable max-len */
const {
  app: { hostname },
} = require('../../../../config');

const IMAGE_HOST_DOMAIN = `${hostname}/images/transactional-emails`;

const FOOTER_TEXT =
  'cloud.gov is a product of the General Services Administration, 1800 F Street NW, Washington, DC 20405';

// common styles
const css = {
  p: 'font-size:16px;line-height:26px;margin:16px 0;',
  a: 'color:#067df7;text-decoration:none;',
};

function centeredButton(link, text) {
  const linkStyle = `
    line-height:100%;
    text-decoration:none;
    display:inline-block;
    max-width:100%;
    background-color:#2672de;
    border-radius:3px;
    color:#fff;
    font-size:16px;
    text-align:center;
    padding:12px 12px 12px 12px;
    font-weight:500
  `;
  return `
    <table
      align="center"
      width="100%"
      border="0"
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style="text-align:center;padding:12px"
    >
      <tbody>
        <tr>
          <td>
            <a href="${link}"
              style="${linkStyle}"
              target="_blank">
              ${text}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  `;
}

function layout(content, preheader = '') {
  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" >
    <html dir="ltr" lang="en">
      <head>
        <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
      </head>
      <body style="background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif;color:#171716">
        <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
          ${preheader}
        </div>
        <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation"
            style="max-width:37.5em;margin:0 auto;padding:20px 0 20px">
          <tbody>
            <tr style="width:100%">
              <td>
                <table id="EMAIL-HEADER" align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                  <tbody>
                    <tr>
                      <td>
                        <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                          <tbody style="width:100%">
                            <tr style="width:100%">
                              <td style="margin-right:auto;text-align:left">
                                <a
                                  href="//cloud.gov/pages"
                                  style="color:#067df7;text-decoration:none" target="_blank">
                                  <img alt="Pages logo" src="${IMAGE_HOST_DOMAIN}/pages-logo.png" height="28" width="100" style="display:block;outline:none;border:none;text-decoration:none;margin-right:auto;text-align:left" />
                                </a>
                              </td>
                              <td style="margin-left:auto;text-align:right">
                              <a href="//cloud.gov" style="color:#067df7;text-decoration:none" target="_blank">
                                  <img alt="Cloud.gov logo" src="${IMAGE_HOST_DOMAIN}/cloud-gov-logo.png"  height="28" width="130" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;text-align:right" />
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <table id="EMAIL-BODY" align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:37.5em;margin:0 auto;padding:10px 0 10px">
          <tbody>
            <tr style="width:100%">
              <td>
                ${content}
                <p style="${css.p}">
                  The <a href="//cloud.gov/pages" style="${css.a}" target="_blank">cloud.gov Pages</a> team
                </p>
              </td>
            </tr>
          </tbody>
        </table>
        <table id="EMAIL-FOOTER" align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:37.5em;margin:0 auto;padding:0 0 20px">
          <tbody>
            <tr style="width:100%">
              <td>
                <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:#cccccc;margin:15px 0" />
                <p style="font-size:12px;line-height:18px;margin:5px 0;color:#171716">
                  ${FOOTER_TEXT}<br />
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `;
}

module.exports = {
  layout,
  css,
  centeredButton,
};
