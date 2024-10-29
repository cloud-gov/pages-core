export const severity = {
  zap: [
    {
      riskCode: '3',
      name: 'High',
      label: 'High risk',
      color: 'risk-high',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#ef4444"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/></svg>',
    },
    {
      riskCode: '2',
      name: 'Medium',
      label: 'Medium risk',
      color: 'risk-medium',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#f97316"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"/></svg>',
    },
    {
      riskCode: '1',
      name: 'Low',
      label: 'Low risk',
      color: 'risk-low',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#facc15"><path d="M4.47 21h15.06c1.54 0 2.5-1.67 1.73-3L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L2.74 18c-.77 1.33.19 3 1.73 3zM12 14c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1s1 .45 1 1v2c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"/></svg>',
    },
    {
      riskCode: '0',
      name: 'Informational',
      label: 'Informational',
      color: 'risk-info',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#16a34a"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1-8h-2V7h2v2z"/></svg>',
    },
    // {
    //   riskCode: null,
    //   name: 'Other',
    //   label: 'unknown',
    //   color: 'risk-unknown',
    //   icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>`
    // },
  ],
  a11y: [
    {
      name: 'critical',
      label: 'Critical',
      color: 'risk-high',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#ef4444"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/></svg>',
    },
    {
      name: 'serious',
      label: 'Serious',
      color: 'risk-medium',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#f97316"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"/></svg>',
    },
    {
      name: 'moderate',
      label: 'Moderate',
      color: 'risk-low',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#facc15"><path d="M4.47 21h15.06c1.54 0 2.5-1.67 1.73-3L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L2.74 18c-.77 1.33.19 3 1.73 3zM12 14c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1s1 .45 1 1v2c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"/></svg>',
    },
    {
      name: 'minor',
      label: 'Minor',
      color: 'risk-info',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#16a34a"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1-8h-2V7h2v2z"/></svg>',
    },
    // {
    //   name: 'other',
    //   color: 'risk-unknown',
    //   icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>`
    // },
  ],
};

export const rulesets = {
  wcag2a: 'WCAG 2.0 Level A',
  wcag2aa: 'WCAG 2.0 Level AA',
  wcag2aaa: 'WCAG 2.0 Level AAA',
  wcag21a: 'WCAG 2.1 Level A',
  wcag21aa: 'WCAG 2.1 Level AA',
  wcag22aa: 'WCAG 2.2 Level AA',
};

export function getSeverityThemeToken(lookup, theme = 'zap') {
  const matcher = theme === 'a11y' ? 'name' : 'riskCode';
  return severity[theme].find((token) => token[matcher] === lookup);
}

export function plural(count, name) {
  return `${name}${count !== 1 ? 's' : ''}`;
}

export function relPath(url, baseurl) {
  return url.split(baseurl)[1];
}
const TT_RULES = {
  '1.A':
    'https://section508coordinators.github.io/TrustedTester/alternate.html#check-alt-version-conformant',
  '1.B':
    'https://section508coordinators.github.io/TrustedTester/alternate.html#check-alt-version-equivalent',
  '1.C':
    'https://section508coordinators.github.io/TrustedTester/alternate.html#check-alt-version-access',
  '1.D':
    'https://section508coordinators.github.io/TrustedTester/alternate.html#check-alt-version-nc-access',
  '1.E':
    'https://section508coordinators.github.io/TrustedTester/alternate.html#check-non-interference',
  '2.A':
    'https://section508coordinators.github.io/TrustedTester/auto.html#check-142-audio-control',
  '2.B':
    'https://section508coordinators.github.io/TrustedTester/auto.html#check-222-blinking-moving-scrolling',
  '2.C':
    'https://section508coordinators.github.io/TrustedTester/auto.html#check-222-auto-updating',
  '2.D':
    'https://section508coordinators.github.io/TrustedTester/auto.html#check-412-change-notify-auto',
  '3.A':
    'https://section508coordinators.github.io/TrustedTester/flashing.html#check-231-flashing',
  '4.A':
    'https://section508coordinators.github.io/TrustedTester/keyboard.html#check-211-keyboard-access',
  '4.B':
    'https://section508coordinators.github.io/TrustedTester/keyboard.html#check-211-no-keystroke-timing',
  '4.C':
    'https://section508coordinators.github.io/TrustedTester/keyboard.html#check-212-no-keyboard-trap',
  '4.D':
    'https://section508coordinators.github.io/TrustedTester/keyboard.html#check-247-focus-visible',
  '4.E':
    'https://section508coordinators.github.io/TrustedTester/keyboard.html#check-321-on-focus',
  '4.F':
    'https://section508coordinators.github.io/TrustedTester/keyboard.html#check-243-focus-order-meaning',
  '4.G':
    'https://section508coordinators.github.io/TrustedTester/keyboard.html#check-243-focus-order-reveal',
  '4.H':
    'https://section508coordinators.github.io/TrustedTester/keyboard.html#check-243-focus-order-return',
  '5.A':
    'https://section508coordinators.github.io/TrustedTester/forms.html#check-332-label-provided',
  '5.B':
    'https://section508coordinators.github.io/TrustedTester/forms.html#check-246-label-descriptive',
  '5.C':
    'https://section508coordinators.github.io/TrustedTester/forms.html#check-131-programmatic-label',
  '5.D':
    'https://section508coordinators.github.io/TrustedTester/forms.html#check-322-on-input',
  '5.E':
    'https://section508coordinators.github.io/TrustedTester/forms.html#check-412-change-notify-form',
  '5.F':
    'https://section508coordinators.github.io/TrustedTester/forms.html#check-331-error-identification',
  '5.G':
    'https://section508coordinators.github.io/TrustedTester/forms.html#check-333-error-suggestion',
  '5.H':
    'https://section508coordinators.github.io/TrustedTester/forms.html#check-334-error-prevention',
  '6.A':
    'https://section508coordinators.github.io/TrustedTester/links.html#check-244-link-purpose',
  '6.B':
    'https://section508coordinators.github.io/TrustedTester/links.html#check-412-change-notify-links',
  '7.A':
    'https://section508coordinators.github.io/TrustedTester/images.html#for-meaningful-images--check-111-meaningful-image-name',
  '7.B':
    'https://section508coordinators.github.io/TrustedTester/images.html#for-decorative-images--check-111-decorative-image',
  '7.C':
    'https://section508coordinators.github.io/TrustedTester/images.html#check-111--decorative-background-image',
  '7.D':
    'https://section508coordinators.github.io/TrustedTester/images.html#check-111-captcha-alternative',
  '7.E':
    'https://section508coordinators.github.io/TrustedTester/images.html#check-145-image-of-text',
  '8.A':
    'https://section508coordinators.github.io/TrustedTester/timelimits.html#check-221-timing-adjustable',
  '9.A':
    'https://section508coordinators.github.io/TrustedTester/repetitive.html#check-241-bypass-function',
  '9.B':
    'https://section508coordinators.github.io/TrustedTester/repetitive.html#check-323-consistent--navigation',
  '9.C':
    'https://section508coordinators.github.io/TrustedTester/repetitive.html#check-324-consistent-identification',
  '10.A':
    'https://section508coordinators.github.io/TrustedTester/structure.html#check-246-heading-purpose',
  '10.B':
    'https://section508coordinators.github.io/TrustedTester/structure.html#check-131-heading-determinable',
  '10.C':
    'https://section508coordinators.github.io/TrustedTester/structure.html#check-131-heading-level',
  '10.D':
    'https://section508coordinators.github.io/TrustedTester/structure.html#check-131-list-type',
  '11.A':
    'https://section508coordinators.github.io/TrustedTester/language.html#check-311-page-language-defined',
  '11.B':
    'https://section508coordinators.github.io/TrustedTester/language.html#check-312-part-language-defined',
  '12.A':
    'https://section508coordinators.github.io/TrustedTester/titles.html#check-242-page-title-defined',
  '12.B':
    'https://section508coordinators.github.io/TrustedTester/titles.html#check-242-page-title-purpose',
  '12.C':
    'https://section508coordinators.github.io/TrustedTester/titles.html#check-412-frame-title',
  '12.D':
    'https://section508coordinators.github.io/TrustedTester/titles.html#check-412-iframe-name',
  '13.A':
    'https://section508coordinators.github.io/TrustedTester/sensory.html#check-141-color-meaning',
  '13.B':
    'https://section508coordinators.github.io/TrustedTester/sensory.html#check-133-sensory-info',
  '13.C':
    'https://section508coordinators.github.io/TrustedTester/sensory.html#check-143-contrast',
  '14.A':
    'https://section508coordinators.github.io/TrustedTester/tables.html#check-131-table-identification',
  '14.B':
    'https://section508coordinators.github.io/TrustedTester/tables.html#check-131-cell-header-association',
  '14.C':
    'https://section508coordinators.github.io/TrustedTester/tables.html#check-131-layout-table-structure',
  '15.A':
    'https://section508coordinators.github.io/TrustedTester/css-content-position.html#check-131-meaningful-content-css-before-after',
  '15.B':
    'https://section508coordinators.github.io/TrustedTester/css-content-position.html#check-132-content-order-meaning-css-position',
  '16.A':
    'https://section508coordinators.github.io/TrustedTester/audiovideo.html#check-121-audio-transcript-text',
  '16.B':
    'https://section508coordinators.github.io/TrustedTester/audiovideo.html#check-121-video--alternative-equivalent',
  '17.A':
    'https://section508coordinators.github.io/TrustedTester/media.html#check-122-captions-equivalent',
  '17.B':
    'https://section508coordinators.github.io/TrustedTester/media.html#check-125-audio-description-equivalent',
  '17.C':
    'https://section508coordinators.github.io/TrustedTester/media.html#check-124-captions-live-equivalent',
  '17.D':
    'https://section508coordinators.github.io/TrustedTester/media.html#check-5034-caption-description-controls',
  '17.E':
    'https://section508coordinators.github.io/TrustedTester/media.html#check-50341-caption-control',
  '17.F':
    'https://section508coordinators.github.io/TrustedTester/media.html#check-50342-description-control',
  '18.A':
    'https://section508coordinators.github.io/TrustedTester/resize.html#check-144-resize-text',
  '19.A':
    'https://section508coordinators.github.io/TrustedTester/multiple.html#check-245-multiple-ways',
  '20.A':
    'https://section508coordinators.github.io/TrustedTester/parsing.html#check-411-parsing',
};

export function getSuccessCriteria({ tags = [], id = '' }) {
  const criteria = tags.map((tag) => {
    if (tag.startsWith('wcag')) {
      switch (tag) {
        case 'wcag2a':
        case 'wcag2aa':
        case 'wcag2aaa':
        case 'wcag21a':
        case 'wcag21aa':
        case 'wcag22aa':
        case 'wcag2a-obsolete':
          break;
        default:
          return {
            // turn wcag111 into "WCAG SC 1.1.1"
            short: `WCAG SC ${tag.split('wcag')[1].split('').join('.')}`,
            url: `https://www.w3.org/TR/WCAG22/#:~:text=Success%20Criterion%20${tag.split('wcag')[1].split('').join('.')}`,
          };
      }
    } else if (tag.startsWith('TT') && tag !== 'TTv5') {
      return {
        // turn TT1.1a into "Trusted Tester 1.1A"
        short: `${tag.toUpperCase().split('TT').join('TT ')}`,
        url:
          TT_RULES[tag.toUpperCase().split('TT')[1]] ||
          'https://section508coordinators.github.io/TrustedTester/appendixc.html',
      };
    } else if (tag === 'ACT') {
      return {
        short: 'ACT',
        url: `https://www.access-board.gov/search/?query=wcag+sc+baseline+${id}`,
      };
    }
    return undefined;
  });
  return criteria.filter((n) => n);
}

export const AXE_TO_ACT = {
  accesskeys: null,
  'area-alt': ['c487ae'],
  'aria-allowed-attr': ['5c01ea'],
  'aria-allowed-role': null,
  'aria-braille-equivalent': null,
  'aria-command-name': ['97a4e1'],
  'aria-conditional-attr': ['5c01ea'],
  'aria-deprecated-role': ['674b10'],
  'aria-dialog-name': null,
  'aria-hidden-body': null,
  'aria-hidden-focus': ['6cfa84'],
  'aria-input-field-name': ['e086e5'],
  'aria-meter-name': null,
  'aria-progressbar-name': null,
  'aria-prohibited-attr': ['5c01ea'],
  'aria-required-attr': ['4e8ab6'],
  'aria-required-children': ['bc4a75', 'ff89c9'],
  'aria-required-parent': ['ff89c9'],
  'aria-roledescription': null,
  'aria-roles': ['674b10'],
  'aria-text': null,
  'aria-toggle-field-name': ['e086e5'],
  'aria-tooltip-name': null,
  'aria-treeitem-name': null,
  'aria-valid-attr-value': ['6a7281'],
  'aria-valid-attr': ['5f99a7'],
  'audio-caption': ['2eb176', 'afb423'],
  'autocomplete-valid': ['73f2c2'],
  'avoid-inline-spacing': ['24afc2', '9e45ec', '78fd32'],
  blink: null,
  'button-name': ['97a4e1', 'm6b1q3'],
  bypass: ['cf77f2', '047fe0', 'b40fd1', '3e12e1', 'ye5d6e'],
  'color-contrast-enhanced': ['09o5cg'],
  'color-contrast': ['afw4f7', '09o5cg'],
  'css-orientation-lock': ['b33eff'],
  'definition-list': null,
  dlitem: null,
  'document-title': ['2779a5'],
  'duplicate-id-active': ['3ea0c8'],
  'duplicate-id-aria': ['3ea0c8'],
  'duplicate-id': ['3ea0c8'],
  'empty-heading': ['ffd0e9'],
  'empty-table-header': null,
  'focus-order-semantics': null,
  'form-field-multiple-labels': null,
  'frame-focusable-content': ['akn7bn'],
  'frame-tested': null,
  'frame-title-unique': ['4b1c6c'],
  'frame-title': ['cae760'],
  'heading-order': null,
  'hidden-content': null,
  'html-has-lang': ['b5c3f8'],
  'html-lang-valid': ['bf051a'],
  'html-xml-lang-mismatch': ['5b7ae0'],
  'identical-links-same-purpose': ['b20e66'],
  'image-alt': ['23a2a8'],
  'image-redundant-alt': null,
  'input-button-name': ['97a4e1'],
  'input-image-alt': ['59796f'],
  'label-content-name-mismatch': ['2ee8b8'],
  'label-title-only': null,
  label: ['e086e5'],
  'landmark-banner-is-top-level': null,
  'landmark-complementary-is-top-level': null,
  'landmark-contentinfo-is-top-level': null,
  'landmark-main-is-top-level': null,
  'landmark-no-duplicate-banner': null,
  'landmark-no-duplicate-contentinfo': null,
  'landmark-no-duplicate-main': null,
  'landmark-one-main': null,
  'landmark-unique': null,
  'link-in-text-block': null,
  'link-name': ['c487ae'],
  list: null,
  listitem: null,
  marquee: null,
  'meta-refresh-no-exceptions': ['bisz58'],
  'meta-refresh': ['bc659a', 'bisz58'],
  'meta-viewport-large': null,
  'meta-viewport': ['b4f0c3'],
  'nested-interactive': ['307n5z'],
  'no-autoplay-audio': ['80f0bf'],
  'object-alt': ['8fc3b6'],
  'p-as-heading': null,
  'page-has-heading-one': null,
  'presentation-role-conflict': ['46ca7f'],
  region: null,
  'role-img-alt': ['23a2a8'],
  'scope-attr-valid': null,
  'scrollable-region-focusable': ['0ssw9k'],
  'select-name': ['e086e5'],
  'server-side-image-map': null,
  'skip-link': null,
  'summary-name': null,
  'svg-img-alt': ['7d6734'],
  tabindex: null,
  'table-duplicate-name': null,
  'table-fake-caption': null,
  'target-size': null,
  'td-has-header': null,
  'td-headers-attr': ['a25f45'],
  'th-has-data-cells': ['d0f69e'],
  'valid-lang': ['de46e4'],
  'video-caption': ['eac66b'],
};

const WCAG_RULES_URL = 'https://www.w3.org/WAI/standards-guidelines/act/rules/';
const ACT_RULES_URL = 'https://act-rules.github.io/rules/';

export function getWCAGRuleURLs(id = '') {
  return (
    AXE_TO_ACT[id]?.flatMap((rule) => [
      `${WCAG_RULES_URL}${rule}`,
      `${ACT_RULES_URL}${rule}`,
    ]) || []
  );
}
