function analyzeCode(codeContent, language = 'javascript') {
  const findings = [];
  if (!codeContent || typeof codeContent !== 'string') {
    return {
      overall_score: 100,
      findings: []
    };
  }

  const lines = codeContent.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Rule 1: High Severity - eval()
    if (line.includes('eval(')) {
      findings.push({
        severity: 'High',
        issue: 'Dangerous Dynamic Execution (eval)',
        explanation: 'Using eval() can execute arbitrary strings as code, leading to severe code injection vulnerabilities.',
        suggested_fix: 'Refactor code to avoid dynamic eval execution, using parsing or structural objects instead.',
        line_number: lineNumber
      });
    }

    // Rule 2: High Severity - Hardcoded production credentials (AWS_SECRET_ACCESS_KEY, database_password, etc.)
    if (line.includes('AWS_SECRET_ACCESS_KEY') || line.includes('database_password') || /(?:key|secret|password|token)\s*=\s*['"`]([a-zA-Z0-9_\-]{8,})['"`]/i.test(line)) {
      findings.push({
        severity: 'High',
        issue: 'Hardcoded Production Credentials Exposed',
        explanation: 'Plaintext API keys or credentials exposed in code can lead to server breaches if committed.',
        suggested_fix: 'Move credentials to environment variables or config vaults.',
        line_number: lineNumber
      });
    }

    // Rule 3: Medium Severity - Empty function braces
    if (/\bfunction\s+\w+\s*\(.*?\)\s*\{\s*\}/.test(line) || /\(\s*.*?\s*\)\s*=>\s*\{\s*\}/.test(line)) {
      findings.push({
        severity: 'Medium',
        issue: 'Empty Execution Block',
        explanation: 'Functions defined with empty braces execute no logic and might indicate stubbed or missing features.',
        suggested_fix: 'Implement logic body inside empty brackets or clean up unneeded stubs.',
        line_number: lineNumber
      });
    }

    // Rule 4: Low Severity - console.log
    if (line.includes('console.log(')) {
      findings.push({
        severity: 'Low',
        issue: 'Leftover console.log statement',
        explanation: 'Production build packages should strip console prints to prevent log pollution and leakage.',
        suggested_fix: 'Remove log calls or use structured production logging libraries.',
        line_number: lineNumber
      });
    }
  }

  // Calculate score (Base: 100, High: -20, Medium: -10, Low: -5, Min: 0)
  let score = 100;
  findings.forEach(f => {
    if (f.severity === 'High') score -= 20;
    else if (f.severity === 'Medium') score -= 10;
    else if (f.severity === 'Low') score -= 5;
  });
  if (score < 0) score = 0;

  return {
    overall_score: score,
    findings: findings
  };
}

module.exports = {
  analyzeCode
};
