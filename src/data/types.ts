export interface StudyQuestion {
  question: string
  answer: string
}

export interface StudyModule {
  id: string
  title: string
  status: 'in-progress' | 'complete'
  goal: string
  tasks: string[]
  concept: string
  sonaMapping: string
  studyPath: string[]
  questions: StudyQuestion[]
  completionQuestions: StudyQuestion[]
  files: string[]
}
