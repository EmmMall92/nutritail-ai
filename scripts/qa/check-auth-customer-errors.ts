import { getCustomerAuthErrorMessage } from "../../lib/auth/customerAuthMessages";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const cases = [
  {
    flow: "login",
    error: new Error("Invalid login credentials"),
    expected: "Έλεγξε email και κωδικό",
  },
  {
    flow: "register",
    error: new Error("User already registered"),
    expected: "Υπάρχει ήδη λογαριασμός",
  },
  {
    flow: "forgot",
    error: new Error("over email send rate limit"),
    expected: "Έγιναν πολλές προσπάθειες",
  },
  {
    flow: "reset",
    error: new Error("invalid token"),
    expected: "Ο σύνδεσμος δεν είναι πλέον ενεργός",
  },
  {
    flow: "login",
    error: new Error("Γράψε email και κωδικό για να συνεχίσεις."),
    expected: "Γράψε email",
  },
  {
    flow: "login",
    error: new Error("Login succeeded, but this account is not an admin."),
    expected: "δεν έχει πρόσβαση διαχείρισης",
  },
] as const;

for (const testCase of cases) {
  const message = getCustomerAuthErrorMessage(testCase.error, testCase.flow);

  assert(
    message.includes(testCase.expected),
    `Expected ${testCase.flow} auth error to include "${testCase.expected}", got "${message}".`
  );
}

console.log("Auth customer error QA passed.");
