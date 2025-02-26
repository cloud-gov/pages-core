module.exports = [
  {
    name: '~assets/',
    type: 'directory',
    children: [
      {
        type: 'generated',
        number: 100,
      },
      {
        name: 'images/',
        type: 'directory',
        children: [
          {
            type: 'file',
            name: 'pages-screenshot.png',
            path: '../../services/local/file-storage/pages-screenshot.png',
          },
          {
            type: 'file',
            name: 'PagesSettings.png',
            path: '../../services/local/file-storage/pages-site-settings.png',
          },
        ],
      },
      {
        name: 'pdfs/',
        type: 'directory',
        children: [
          {
            type: 'file',
            name: 'cloudgov-customers.pdf',
            path: '../../services/local/file-storage/cloudgov-customers.pdf',
          },
          {
            type: 'file',
            name: 'Cloudgov Overview.pdf',
            path: '../../services/local/file-storage/cloudgov-overview.pdf',
          },
        ],
      },
      {
        name: 'dir-1/',
        type: 'directory',
        children: [
          {
            name: 'subdir/',
            type: 'directory',
            children: [
              {
                type: 'generated',
                number: 10,
              },
            ],
          },
          {
            name: 'subdir-empty/',
            type: 'directory',
            children: [],
          },
          {
            type: 'generated',
            number: 100,
          },
        ],
      },
    ],
  },
];
