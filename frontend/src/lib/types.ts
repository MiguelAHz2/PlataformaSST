export type Role = 'ADMIN' | 'STUDENT';
export type Level = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type LessonType = 'TEXT' | 'VIDEO' | 'PDF' | 'PRESENTATION';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

export interface Company {
  id: string;
  name: string;
  nit?: string;
  contact?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  users?: User[];
  _count?: {
    users: number;
    courses: number;
    workshops: number;
    evaluations: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  company?: string;
  position?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  orgId?: string;
  org?: { id: string; name: string };
  createdAt?: string;
  _count?: {
    enrollments: number;
    submissions: number;
    certificates: number;
  };
}

export interface Course {
  id: string;
  title: string;
  description: string;
  image?: string;
  category: string;
  duration?: string;
  level: Level;
  isPublished: boolean;
  orgId?: string | null;
  org?: { id: string; name: string } | null;
  createdAt: string;
  modules?: Module[];
  evaluations?: Evaluation[];
  enrollments?: Enrollment[];
  _count?: {
    modules: number;
    enrollments: number;
    evaluations: number;
  };
}

export interface Module {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content?: string;
  type: LessonType;
  fileUrl?: string;
  originalName?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  moduleId: string;
  completions?: { id: string }[];
}

export interface Workshop {
  id: string;
  title: string;
  description: string;
  courseId: string;
  dueDate?: string;
  isPublished: boolean;
  orgId?: string | null;
  org?: { id: string; name: string } | null;
  createdAt: string;
  course?: { id: string; title: string };
  submissions?: WorkshopSubmission[];
  _count?: { submissions: number };
}

export interface WorkshopSubmission {
  id: string;
  userId: string;
  workshopId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  comment?: string;
  grade?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
  user?: User;
  workshop?: Workshop;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  enrolledAt: string;
  completedAt?: string;
  course?: Course;
  user?: User;
}

export interface Option {
  id: string;
  text: string;
  isCorrect?: boolean;
  questionId: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  points: number;
  order: number;
  evaluationId: string;
  options: Option[];
}

export interface Evaluation {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  timeLimit?: number;
  passingScore: number;
  isPublished: boolean;
  dueDate?: string;
  orgId?: string | null;
  org?: { id: string; name: string } | null;
  createdAt: string;
  course?: { id: string; title: string };
  questions?: Question[];
  submissions?: Submission[];
  _count?: {
    questions: number;
    submissions: number;
  };
}

export interface Submission {
  id: string;
  userId: string;
  evaluationId: string;
  score?: number;
  passed?: boolean;
  startedAt: string;
  completedAt?: string;
  evaluation?: Evaluation;
  user?: User;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  submissionId: string;
  questionId: string;
  optionId?: string;
  isCorrect?: boolean;
  question?: Question;
  option?: Option;
}

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalEvaluations: number;
  totalSubmissions: number;
  totalWorkshops: number;
  totalWorkshopSubmissions: number;
  recentUsers: User[];
  recentSubmissions: (Submission & { user: { name: string }; evaluation: { title: string } })[];
}
