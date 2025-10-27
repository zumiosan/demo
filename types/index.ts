import { User, Agent, Project, Task, Interview, TeamMember } from '@prisma/client';

export type UserWithAgent = User & {
  agent: Agent | null;
};

export type ProjectWithAgent = Project & {
  agent: Agent | null;
};

export type TaskWithDetails = Task & {
  project: Project;
  assignedUser: User | null;
  agent: Agent | null;
};

export type InterviewWithDetails = Interview & {
  project: Project;
  user: User;
};

export type TeamMemberWithDetails = TeamMember & {
  project: Project;
  user: UserWithAgent;
};
