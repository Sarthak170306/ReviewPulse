function analyzeCode(codeContent, language = 'javascript') {
  const findings = [];
  if (!codeContent || typeof codeContent !== 'string') return findings;

  const lines = codeContent.split(/\r?\n/);
  const normalizedLang = (language || 'javascript').toLowerCase();

  // General secret scanning regex
  const secretRegex = /(?:key|secret|password|token)\s*=\s*['"`]([a-zA-Z0-9_\-]{8,})['"`]/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Rule 1: General hardcoded credential check
    const secretMatch = line.match(secretRegex);
    if (secretMatch) {
      // Exclude potential false positives (like variable declarations with placeholders)
      const potentialSecret = secretMatch[1].toLowerCase();
      if (!potentialSecret.includes('placeholder') && !potentialSecret.includes('your_') && !potentialSecret.includes('my_')) {
        findings.push({
          severity: 'High',
          issue: 'Hardcoded secret or credential key',
          explanation: 'Plaintext secret detected in source code. This poses a major security threat if exposed.',
          suggested_fix: 'Move secret key to environment variables (process.env) or an external vaults system.',
          line_number: lineNumber
        });
      }
    }

    // JS / TS Specific scanning rules
    if (normalizedLang === 'javascript' || normalizedLang === 'typescript' || normalizedLang === 'js' || normalizedLang === 'ts') {
      // Rule 2: Leftover console.log statements
      if (line.includes('console.log(')) {
        findings.push({
          severity: 'Low',
          issue: 'Leftover console.log statement',
          explanation: 'Production code should avoid print logs to prevent performance drops or console leakage.',
          suggested_fix: 'Remove console.log or replace it with a structured logging module.',
          line_number: lineNumber
        });
      }

      // Rule 3: Legacy var declarations
      if (/\bvar\s+\w+/.test(line)) {
        findings.push({
          severity: 'Medium',
          issue: 'Legacy var declaration',
          explanation: 'Using var can cause variable hoisting conflicts. Modern JS requires let/const.',
          suggested_fix: 'Replace var with const or let block scope declarations.',
          line_number: lineNumber
        });
      }

      // Rule 4: Empty catch blocks
      if (/\bcatch\s*\(.*?\)\s*\{\s*\}/.test(line)) {
        findings.push({
          severity: 'Medium',
          issue: 'Empty catch block',
          explanation: 'Errors are caught but ignored completely, suppressing unexpected bugs.',
          suggested_fix: 'Implement error logging or handling inside the catch block.',
          line_number: lineNumber
        });
      }

      // Rule 5: Empty function declarations
      if (/\bfunction\s+\w+\s*\(.*?\)\s*\{\s*\}/.test(line) || /\(\s*.*?\s*\)\s*=>\s*\{\s*\}/.test(line)) {
        findings.push({
          severity: 'Low',
          issue: 'Empty function block',
          explanation: 'Function declaration is defined but contains no logic body.',
          suggested_fix: 'Implement function block logic or add a descriptive comment.',
          line_number: lineNumber
        });
      }
    }

    // Python Specific scanning rules
    if (normalizedLang === 'python' || normalizedLang === 'py') {
      // Rule 6: Bare except statements
      if (/\bexcept\s*:/.test(line)) {
        findings.push({
          severity: 'High',
          issue: 'Bare except handler clause',
          explanation: 'Using except: catches all exceptions, masking debugging indicators.',
          suggested_fix: 'Catch specific exception groups (e.g. except Exception: or except ValueError:).',
          line_number: lineNumber
        });
      }

      // Rule 7: Leftover print statements
      if (/\bprint\(/.test(line)) {
        findings.push({
          severity: 'Low',
          issue: 'Leftover print statement',
          explanation: 'Clean up print debugging calls before committing code.',
          suggested_fix: 'Remove print statement or use logging modules.',
          line_number: lineNumber
        });
      }

      // Rule 8: Missing docstring below function definition
      if (/\bdef\s+\w+\s*\(/.test(line)) {
        // Check next line bounds
        const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
        if (nextLine && !nextLine.startsWith('"""') && !nextLine.startsWith("'''")) {
          findings.push({
            severity: 'Low',
            issue: 'Missing function docstring documentation',
            explanation: 'Python functions should document behavior and parameters under docstrings.',
            suggested_fix: 'Add a docstring below the def block.',
            line_number: lineNumber
          });
        }
      }
    }
  }

  return findings;
}

module.exports = {
  analyzeCode
};
