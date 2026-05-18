export interface University { id: string; name: string; shortName: string; location: string; courses: number; students: string; logo: string; }
export interface Course { id: string; universityId: string; name: string; code: string; duration: string; semesters: number; }
export interface Semester { id: string; courseId: string; number: number; subjects: number; }
export interface Subject { id: string; semesterId: string; name: string; code: string; credits: number; units: number; }
export interface Unit { id: string; subjectId: string; number: number; title: string; videos: number; materials: number; }

export const universities: University[] = [
  { id: "u1", name: "Delhi University", shortName: "DU", location: "New Delhi", courses: 42, students: "1.2k", logo: "🎓" },
  { id: "u2", name: "Mumbai University", shortName: "MU", location: "Mumbai", courses: 38, students: "980", logo: "🏛️" },
  { id: "u3", name: "Indian Institute of Technology", shortName: "IIT Delhi", location: "New Delhi", courses: 24, students: "640", logo: "⚙️" },
  { id: "u4", name: "Jawaharlal Nehru University", shortName: "JNU", location: "New Delhi", courses: 36, students: "820", logo: "📚" },
  { id: "u5", name: "Banaras Hindu University", shortName: "BHU", location: "Varanasi", courses: 50, students: "1.5k", logo: "🕉️" },
  { id: "u6", name: "Anna University", shortName: "AU", location: "Chennai", courses: 30, students: "720", logo: "🏫" },
];

export const courses: Course[] = [
  { id: "c1", universityId: "u1", name: "B.Sc. Computer Science", code: "BSC-CS", duration: "3 years", semesters: 6 },
  { id: "c2", universityId: "u1", name: "B.Com. (Hons)", code: "BCOM-H", duration: "3 years", semesters: 6 },
  { id: "c3", universityId: "u1", name: "B.A. Economics", code: "BA-ECO", duration: "3 years", semesters: 6 },
  { id: "c4", universityId: "u1", name: "M.Sc. Mathematics", code: "MSC-MAT", duration: "2 years", semesters: 4 },
];

export const semesters: Semester[] = Array.from({ length: 6 }, (_, i) => ({
  id: `s-c1-${i + 1}`, courseId: "c1", number: i + 1, subjects: 5,
}));

export const subjects: Subject[] = [
  { id: "sub1", semesterId: "s-c1-1", name: "Programming Fundamentals", code: "CS101", credits: 4, units: 5 },
  { id: "sub2", semesterId: "s-c1-1", name: "Discrete Mathematics", code: "MA101", credits: 4, units: 5 },
  { id: "sub3", semesterId: "s-c1-1", name: "Digital Logic Design", code: "EC101", credits: 3, units: 4 },
  { id: "sub4", semesterId: "s-c1-1", name: "English Communication", code: "EN101", credits: 2, units: 4 },
  { id: "sub5", semesterId: "s-c1-1", name: "Environmental Studies", code: "ES101", credits: 2, units: 5 },
];

export const units: Unit[] = [
  { id: "un1", subjectId: "sub1", number: 1, title: "Introduction to Programming", videos: 8, materials: 4 },
  { id: "un2", subjectId: "sub1", number: 2, title: "Control Structures & Loops", videos: 10, materials: 5 },
  { id: "un3", subjectId: "sub1", number: 3, title: "Functions & Recursion", videos: 7, materials: 3 },
  { id: "un4", subjectId: "sub1", number: 4, title: "Arrays & Strings", videos: 9, materials: 4 },
  { id: "un5", subjectId: "sub1", number: 5, title: "Object-Oriented Programming", videos: 12, materials: 6 },
];

export const getUniversity = (id: string) => universities.find(u => u.id === id);
export const getCourse = (id: string) => courses.find(c => c.id === id);
export const getSemester = (id: string) => semesters.find(s => s.id === id);
export const getSubject = (id: string) => subjects.find(s => s.id === id);
export const getUnit = (id: string) => units.find(u => u.id === id);
export const coursesByUniv = (id: string) => courses.filter(c => c.universityId === id);
export const semestersByCourse = (id: string) => semesters.filter(s => s.courseId === id);
export const subjectsBySemester = (id: string) => subjects.filter(s => s.semesterId === id);
export const unitsBySubject = (id: string) => units.filter(u => u.subjectId === id);
