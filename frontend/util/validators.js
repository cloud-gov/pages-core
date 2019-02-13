const validBranchName = s => /^[^-][a-zA-Z0-9._/-]+$/.test(s);

export default validBranchName;
