const validBranchName = s => /^[\w._]+(?:[/-]*[\w._])*$/.test(s);

export default validBranchName;
