import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function SuppressRuleToggle({ ruleId = ''}) {


  return (
    <>
      <br />
      Suppress findings like this?
      <br />
      RuleId:
      {ruleId}
    </>
  );
}

SuppressRuleToggle.propTypes = {
  ruleId: PropTypes.string.isRequired,
};

export default SuppressRuleToggle;
export { SuppressRuleToggle };
