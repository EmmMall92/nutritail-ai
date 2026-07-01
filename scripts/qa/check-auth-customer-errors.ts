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
    expected: "Το link δεν είναι πλέον ενεργό",
  },
  {
    flow: "login",
    error: new Error("Γράψε email και κωδικό για να συνεχίσεις."),
    expected: "Γράψε email",
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
