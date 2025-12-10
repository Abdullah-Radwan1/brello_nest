// This is a TypeScript "enum-like" object for roles.
// We define the allowed role values as constants to use for type safety and autocompletion.
export const RoleEnumTS = {
  CONTRIBUTOR: 'contributor', // Represents a standard contributor role
  MANAGER: 'manager', // Represents a project manager role
} as const; // 'as const' tells TypeScript these values are **readonly literals**, not just strings

// This allows TypeScript to enforce valid role values wherever RoleTS is used.
export type RoleTS = (typeof RoleEnumTS)[keyof typeof RoleEnumTS];

// Input type for a contributor when creating a project
export type ContributorInput = {
  userId: string; // The ID of the user to be added as a contributor
  role: RoleTS; // Optional role, must be one of the RoleTS values ('contributor' or 'manager')
  // If not provided, you can default it to 'contributor' in your function
};

// Input type for creating a project
export type CreateProjectInput = {
  name: string;
  description: string;
  contributors?: ContributorInput[];
};
