import { PrismaClient, Role, SubjectPart } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function studentUsername(name: string, rollNo: number) {
  const first = (name.trim().split(/\s+/)[0] ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const prefix = first.length === 0 ? "stu" : first.length < 3 ? first : first.slice(0, 3);
  return `${prefix}${rollNo}`;
}

async function studentLogin(studentId: string, name: string, rollNo: number, parentMobile: string) {
  await prisma.user.create({
    data: {
      name,
      email: studentUsername(name, rollNo),
      passwordHash: await bcrypt.hash(parentMobile, 10),
      role: Role.STUDENT,
      studentId,
    },
  });
}

async function seedSubjects(classId: string) {
  const partANames = ["Kannada", "English", "Hindi", "Mathematics", "EVS/Science"];
  const partBNames = ["Computer Science", "Physical Education", "Drawing"];
  const a = [];
  for (let i = 0; i < partANames.length; i++) {
    a.push(
      await prisma.subject.create({
        data: { classId, name: partANames[i], part: SubjectPart.A, sortOrder: i + 1, active: true },
      })
    );
  }
  const b = [];
  for (let i = 0; i < partBNames.length; i++) {
    b.push(
      await prisma.subject.create({
        data: { classId, name: partBNames[i], part: SubjectPart.B, sortOrder: partANames.length + i + 1, active: true },
      })
    );
  }
  return { a, b };
}

const partAMarks = [
  [
    [12, 13, 19, 13, 14, 19],
    [12, 13, 20, 13, 14, 19],
    [11, 12, 18, 12, 11, 16],
    [12, 13, 19, 13, 14, 17],
    [12, 13, 19, 14, 13, 16],
  ],
  [
    [13, 12, 16, 12, 13, 17],
    [11, 12, 15, 12, 11, 16],
    [10, 11, 14, 11, 10, 15],
    [14, 13, 18, 13, 14, 18],
    [12, 12, 16, 12, 13, 16],
  ],
  [
    [14, 14, 18, 14, 13, 19],
    [13, 14, 19, 14, 14, 18],
    [12, 13, 17, 13, 12, 17],
    [14, 15, 19, 14, 14, 19],
    [13, 14, 18, 13, 14, 18],
  ],
  [
    [9, 10, 12, 10, 9, 13],
    [10, 11, 14, 11, 10, 14],
    [8, 9, 12, 9, 8, 12],
    [11, 10, 15, 10, 11, 14],
    [10, 10, 13, 10, 10, 13],
  ],
  [
    [13, 14, 18, 13, 14, 18],
    [14, 13, 19, 13, 14, 19],
    [12, 13, 17, 13, 12, 16],
    [15, 14, 19, 14, 15, 18],
    [13, 13, 18, 14, 13, 17],
  ],
  [
    [11, 12, 15, 12, 11, 16],
    [12, 11, 16, 11, 12, 15],
    [10, 11, 14, 11, 12, 14],
    [13, 12, 17, 12, 13, 16],
    [11, 12, 15, 12, 11, 15],
  ],
];

async function main() {
  await prisma.grievance.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.feeItem.deleteMany();
  await prisma.feeTemplateItem.deleteMany();
  await prisma.examCard.deleteMany();
  await prisma.examRelease.deleteMany();
  await prisma.partBCell.deleteMany();
  await prisma.markCell.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.markSheet.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.schoolClass.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.user.deleteMany();
  await prisma.schoolSettings.deleteMany();

  await prisma.schoolSettings.create({
    data: {
      id: "singleton",
      name: "JAIMINI PUBLIC SCHOOL",
      tagline: "SERVE FOR NATION",
      address: "Mysore Road, behind Taha Palace, Hiriyur, Karnataka 577598",
      phone: "08199-123456",
      website: "www.jaiminipublicschool.edu.in",
      logoUrl: "/uploads/logo/jaimini-logo.png",
      footerQuote: "Shaping Minds, Building Futures, Creating Leaders",
      schoolCode: "JPS",
    },
  });

  const principal = await prisma.user.create({
    data: {
      name: "Principal N. Ramesh",
      email: "principal@jaimini.edu",
      passwordHash: await bcrypt.hash("principal123", 10),
      role: Role.PRINCIPAL,
    },
  });

  const teacherA = await prisma.user.create({
    data: {
      name: "Lakshmi R",
      email: "teacher12a@jaimini.edu",
      passwordHash: await bcrypt.hash("teacher123", 10),
      role: Role.CLASS_TEACHER,
    },
  });

  const teacherB = await prisma.user.create({
    data: {
      name: "Arjun Rao",
      email: "teacher10b@jaimini.edu",
      passwordHash: await bcrypt.hash("teacher123", 10),
      role: Role.CLASS_TEACHER,
    },
  });

  const year = await prisma.academicYear.create({
    data: { label: "2024-2025", isActive: true },
  });

  const class12A = await prisma.schoolClass.create({
    data: { yearId: year.id, name: "12", section: "A", classTeacherId: teacherA.id },
  });
  const class10B = await prisma.schoolClass.create({
    data: { yearId: year.id, name: "10", section: "B", classTeacherId: teacherB.id },
  });

  const sub12 = await seedSubjects(class12A.id);
  const subjectsA = sub12.a;
  const subjectsB = sub12.b;

  const class12Students = [
    { admissionNo: "JPS-2024-012", name: "Manvitha R", fatherName: "Ramesh B", motherName: "Lakshmi R", photoUrl: "/uploads/photos/manvitha.svg", rollNo: 12, parentMobile: "9876543210", remarks: "Consistent performer. Keep it up.", att: [90, 86, 92, 88] },
    { admissionNo: "JPS-2024-001", name: "Arjun K", fatherName: "Kiran K", motherName: "Meena K", photoUrl: "", rollNo: 1, parentMobile: "9876500001", remarks: "Good progress in mathematics.", att: [90, 82, 92, 80] },
    { admissionNo: "JPS-2024-005", name: "Diya S", fatherName: "Suresh S", motherName: "Anitha S", photoUrl: "", rollNo: 5, parentMobile: "9876500005", remarks: "Excellent participation in cultural events.", att: [90, 88, 92, 90] },
    { admissionNo: "JPS-2024-008", name: "Rahul M", fatherName: "Mohan M", motherName: "Kavitha M", photoUrl: "", rollNo: 8, parentMobile: "9876500008", remarks: "Needs to improve Hindi.", att: [90, 70, 92, 74] },
    { admissionNo: "JPS-2024-015", name: "Ananya P", fatherName: "Prakash P", motherName: "Divya P", photoUrl: "", rollNo: 15, parentMobile: "9876500015", remarks: "Strong in sciences.", att: [90, 85, 92, 87] },
    { admissionNo: "JPS-2024-003", name: "Karthik N", fatherName: "Nagaraj N", motherName: "Sunitha N", photoUrl: "", rollNo: 3, parentMobile: "9876500003", remarks: "", att: [90, 84, 92, 86] },
  ];

  const class12Enrollments: string[] = [];

  for (let i = 0; i < class12Students.length; i++) {
    const s = class12Students[i];
    const student = await prisma.student.create({
      data: {
        admissionNo: s.admissionNo,
        name: s.name,
        fatherName: s.fatherName,
        motherName: s.motherName,
        photoUrl: s.photoUrl,
        parentMobile: s.parentMobile,
      },
    });
    const enrollment = await prisma.enrollment.create({
      data: { studentId: student.id, classId: class12A.id, yearId: year.id, rollNo: s.rollNo },
    });
    class12Enrollments.push(enrollment.id);
    await studentLogin(student.id, s.name, s.rollNo, s.parentMobile);
    await prisma.examCard.create({
      data: {
        enrollmentId: enrollment.id,
        exam: "FA1",
        verificationCode: `JPS2512A${String(s.rollNo).padStart(3, "0")}FA1`,
      },
    });
    const approved = i < 3;
    const sheet = await prisma.markSheet.create({
      data: {
        enrollmentId: enrollment.id,
        yearId: year.id,
        status: approved ? "APPROVED" : "SUBMITTED",
        submittedAt: new Date(),
        approvedAt: approved ? new Date() : null,
        verificationCode: approved ? `JPS2512A${String(s.rollNo).padStart(3, "0")}` : null,
        attendanceWorkS1: s.att[0],
        attendancePresentS1: s.att[1],
        attendanceWorkS2: s.att[2],
        attendancePresentS2: s.att[3],
        remarks: s.remarks,
      },
    });
    const marks = partAMarks[i];
    for (let j = 0; j < subjectsA.length; j++) {
      const [fa1, fa2, sa1, fa3, fa4, sa2] = marks[j];
      await prisma.markCell.create({
        data: { markSheetId: sheet.id, subjectId: subjectsA[j].id, fa1, fa2, sa1, fa3, fa4, sa2 },
      });
    }
    for (const sub of subjectsB) {
      await prisma.partBCell.create({
        data: {
          markSheetId: sheet.id,
          subjectId: sub.id,
          fa01: 12,
          fa02: 13,
          sa01: 16,
          fa03: 12,
          fa04: 13,
          sa02: 17,
          total: 83,
        },
      });
    }
  }

  await prisma.examRelease.create({
    data: {
      classId: class12A.id,
      exam: "FA1",
      status: "APPROVED",
      submittedAt: new Date(),
      approvedAt: new Date(),
    },
  });
  await prisma.examRelease.create({
    data: { classId: class12A.id, exam: "FA2", status: "DRAFT" },
  });

  const feeRows = [
    { particular: "Tuition fee", amount: 25000, paid: 25000, dueDate: "", note: "Term 1 & 2" },
    { particular: "Exam fee", amount: 3000, paid: 0, dueDate: "2025-03-31", note: "" },
    { particular: "Computer lab", amount: 1500, paid: 1500, dueDate: "", note: "" },
  ];
  for (let i = 0; i < feeRows.length; i++) {
    await prisma.feeTemplateItem.create({
      data: { classId: class12A.id, sortOrder: i + 1, ...feeRows[i] },
    });
  }
  for (const enrollmentId of class12Enrollments) {
    for (let i = 0; i < feeRows.length; i++) {
      await prisma.feeItem.create({
        data: { enrollmentId, sortOrder: i + 1, ...feeRows[i] },
      });
    }
  }

  const sub10 = await seedSubjects(class10B.id);

  const class10Students = [
    { admissionNo: "JPS-2024-101", name: "Sneha G", fatherName: "Gopal G", motherName: "Radha G", rollNo: 1, parentMobile: "9876510001" },
    { admissionNo: "JPS-2024-104", name: "Vikram H", fatherName: "Harish H", motherName: "Poornima H", rollNo: 4, parentMobile: "9876510004" },
    { admissionNo: "JPS-2024-107", name: "Nisha T", fatherName: "Thimmappa T", motherName: "Geetha T", rollNo: 7, parentMobile: "9876510007" },
    { admissionNo: "JPS-2024-109", name: "Rohan B", fatherName: "Basavaraj B", motherName: "Latha B", rollNo: 9, parentMobile: "9876510009" },
  ];

  for (let i = 0; i < class10Students.length; i++) {
    const s = class10Students[i];
    const student = await prisma.student.create({
      data: {
        admissionNo: s.admissionNo,
        name: s.name,
        fatherName: s.fatherName,
        motherName: s.motherName,
        parentMobile: s.parentMobile,
      },
    });
    const enrollment = await prisma.enrollment.create({
      data: { studentId: student.id, classId: class10B.id, yearId: year.id, rollNo: s.rollNo },
    });
    await studentLogin(student.id, s.name, s.rollNo, s.parentMobile);
    const sheet = await prisma.markSheet.create({
      data: {
        enrollmentId: enrollment.id,
        yearId: year.id,
        status: "DRAFT",
        attendanceWorkS1: 88,
        attendancePresentS1: 80 + i,
        attendanceWorkS2: 90,
        attendancePresentS2: 82 + i,
      },
    });
    const marks = partAMarks[i];
    for (let j = 0; j < sub10.a.length; j++) {
      const [fa1, fa2, sa1, fa3, fa4, sa2] = marks[j];
      await prisma.markCell.create({
        data: { markSheetId: sheet.id, subjectId: sub10.a[j].id, fa1, fa2, sa1, fa3, fa4, sa2 },
      });
    }
    for (const sub of sub10.b) {
      await prisma.partBCell.create({ data: { markSheetId: sheet.id, subjectId: sub.id } });
    }
  }

  // Extra dummy class so Principal dashboard has both Pending (12-A) and Approved (9-A).
  // Fake test data only — replace when real school records arrive. No photos.
  const teacherC = await prisma.user.create({
    data: {
      name: "Sunitha K",
      email: "teacher9a@jaimini.edu",
      passwordHash: await bcrypt.hash("teacher123", 10),
      role: Role.CLASS_TEACHER,
    },
  });
  const class9A = await prisma.schoolClass.create({
    data: { yearId: year.id, name: "9", section: "A", classTeacherId: teacherC.id },
  });
  const sub9 = await seedSubjects(class9A.id);
  const class9Students = [
    { admissionNo: "JPS-2024-201", name: "Meera D", fatherName: "Dinesh D", motherName: "Shobha D", rollNo: 1, parentMobile: "9876520001", remarks: "Dummy test remarks." },
    { admissionNo: "JPS-2024-202", name: "Aditya V", fatherName: "Vinay V", motherName: "Rekha V", rollNo: 2, parentMobile: "9876520002", remarks: "Dummy test remarks." },
    { admissionNo: "JPS-2024-203", name: "Pooja S", fatherName: "Sanjay S", motherName: "Asha S", rollNo: 3, parentMobile: "9876520003", remarks: "Dummy test remarks." },
    { admissionNo: "JPS-2024-204", name: "Nikhil R", fatherName: "Ravi R", motherName: "Indira R", rollNo: 4, parentMobile: "9876520004", remarks: "Dummy test remarks." },
    { admissionNo: "JPS-2024-205", name: "Ishita M", fatherName: "Manoj M", motherName: "Priya M", rollNo: 5, parentMobile: "9876520005", remarks: "Dummy test remarks." },
  ];
  for (let i = 0; i < class9Students.length; i++) {
    const s = class9Students[i];
    const student = await prisma.student.create({
      data: { admissionNo: s.admissionNo, name: s.name, fatherName: s.fatherName, motherName: s.motherName, parentMobile: s.parentMobile },
    });
    const enrollment = await prisma.enrollment.create({
      data: { studentId: student.id, classId: class9A.id, yearId: year.id, rollNo: s.rollNo },
    });
    await studentLogin(student.id, s.name, s.rollNo, s.parentMobile);
    const approved = i < 3;
    const sheet = await prisma.markSheet.create({
      data: {
        enrollmentId: enrollment.id,
        yearId: year.id,
        status: approved ? "APPROVED" : "SUBMITTED",
        submittedAt: new Date(),
        approvedAt: approved ? new Date() : null,
        verificationCode: approved ? `JPS259A${String(s.rollNo).padStart(3, "0")}` : null,
        attendanceWorkS1: 90,
        attendancePresentS1: 82 + i,
        attendanceWorkS2: 92,
        attendancePresentS2: 84 + i,
        remarks: s.remarks,
      },
    });
    const marks = partAMarks[i % partAMarks.length];
    for (let j = 0; j < sub9.a.length; j++) {
      const [fa1, fa2, sa1, fa3, fa4, sa2] = marks[j];
      await prisma.markCell.create({
        data: { markSheetId: sheet.id, subjectId: sub9.a[j].id, fa1, fa2, sa1, fa3, fa4, sa2 },
      });
    }
    for (const sub of sub9.b) {
      await prisma.partBCell.create({
        data: {
          markSheetId: sheet.id,
          subjectId: sub.id,
          fa01: 11 + (i % 3),
          fa02: 12,
          sa01: 16,
          fa03: 12,
          fa04: 13,
          sa02: 17,
          total: 81 + (i % 3),
        },
      });
    }
  }

  await prisma.announcement.create({
    data: {
      authorId: principal.id,
      title: "Term results",
      body: "Class 12-A report cards are published. Parents may log in with the student username (first 3 letters of first name + roll) and the parent mobile number.",
    },
  });
  await prisma.announcement.create({
    data: {
      authorId: teacherA.id,
      classId: class12A.id,
      title: "FA1 marks published",
      body: "FA1 marks are published. Open Marks on the student portal to view and download the FA-I report card. FA2 is not published yet.",
    },
  });

  console.log("Jaimini Public School seed complete (fake test data — replace later)");
  console.log("Principal:     principal@jaimini.edu / principal123");
  console.log("Class 12-A:    teacher12a@jaimini.edu / teacher123  (FA1 approved, FA2 draft; 3 overall approved)");
  console.log("Class 10-B:    teacher10b@jaimini.edu / teacher123  (DRAFT — teacher still editing)");
  console.log("Class 9-A:     teacher9a@jaimini.edu / teacher123  (3 approved, 2 waiting)");
  console.log("Student demo:  man12 / 9876543210  (Manvitha R, 12-A, FA1 + Overall published, FA2 locked)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
