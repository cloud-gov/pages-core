function layout(content) {
  return `
    <!DOCTYPE html>

    <html>
      <head lang="en">
        <meta charset="UTF-8" />
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;
}

module.exports = layout;
