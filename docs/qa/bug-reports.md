# Bug report samples from public coursework

These are documented defects observed in the existing public projects and corrected during the portfolio review. They are not invented customer incidents. The review and fixes were performed with AI assistance. Links point to the merged changes and regression coverage.

## SHELL-001 — Absolute commands replace the shell

**Severity:** High · **Status:** Fixed

**Environment:** Linux, strict GCC GNU89 build of the original shell revision `964657592c03e8c8d705b7df7c5404280f2994fe`.

**Steps:**

1. Compile the C sources into `hsh`.
2. Run `printf '/bin/echo first\n/bin/echo second\n' | ./hsh`.

**Expected:** Both lines print, in order.

**Observed:** Only `first` prints. Absolute-path `execve` runs in the parent and replaces the interpreter.

**Fix and verification:** Execute every external command in a child and wait for its status. `test_absolute_commands_keep_shell_alive` checks both outputs. [Merged fix](https://github.com/Gerald219/holbertonschool-simple_shell/pull/1).

## SHELL-002 — Noninteractive input includes prompts and exit text

**Severity:** Medium · **Status:** Fixed

**Environment:** Original shell revision above.

**Steps:**

1. Run `printf 'echo hello\n' | ./hsh`.
2. Compare stdout with `hello` followed by one newline.

**Expected:** Command output only.

**Observed in source and original behavior:** The main loop calls `display_prompt()` regardless of whether stdin is a terminal, and prints an exit message at EOF. These extra strings pollute piped output.

**Fix and verification:** Display prompts only for a terminal and make EOF quiet. `test_path_lookup` and `test_eof_is_quiet` assert the output. [Merged fix](https://github.com/Gerald219/holbertonschool-simple_shell/pull/1).

## HBNB-001 — Configured JWT key is overwritten

**Severity:** High · **Status:** Fixed

**Environment:** Original HBnB revision `5e3a69b3607c81fd0259ed5d758ff878e1cf951d`.

**Steps:**

1. Create an app using a configuration with a distinct `JWT_SECRET_KEY`.
2. Inspect the key after extension initialization and test token signing across configurations.

**Expected:** The application uses the supplied key; another app with a different key rejects the token.

**Observed:** `init_extensions()` assigns the same hardcoded `your-secret-key` value over the configured value.

**Fix and verification:** Remove the override; require keys in deployment configuration. `test_custom_jwt_secret_is_used_for_signing` verifies successful decoding with the correct configuration and rejection by a different one. [Merged fix](https://github.com/Gerald219/holbertonschool-hbnb/pull/1).
