import type { ExamCardView } from "@/lib/load-exam-card";
import Barcode from "./Barcode";
import "./report-card.css";

export default function ExamReportCard({ card }: { card: ExamCardView }) {
  return (
    <article className="rc-sheet">
      <div className="rc-wave rc-wave-top" aria-hidden />
      <header className="rc-header">
        <img className="rc-logo" src={card.school.logoUrl || "/uploads/logo/jaimini-logo.png"} alt="" />
        <div className="rc-header-text">
          <h1>{card.school.name}</h1>
          <p className="rc-tagline">{card.school.tagline}</p>
          <p className="rc-meta">
            {card.school.address} | Ph: {card.school.phone} | {card.school.website}
          </p>
        </div>
        <div className="rc-photo-wrap">
          {card.photoUrl ? (
            <img src={card.photoUrl} alt={card.studentName} />
          ) : (
            <div className="rc-photo-empty">Photo</div>
          )}
        </div>
      </header>

      <h2 className="rc-title">{card.title}</h2>
      <p className="rc-subtitle">{card.yearLabel}</p>

      <div className="rc-info">
        <div>
          <span>Student Name :</span> <strong>{card.studentName}</strong>
        </div>
        <div>
          <span>Class :</span> <strong>{card.className}</strong>
        </div>
        <div>
          <span>Section :</span> <strong>{card.section}</strong>
        </div>
        <div>
          <span>Roll No. :</span> <strong>{card.rollNo}</strong>
        </div>
        <div>
          <span>Father&apos;s Name :</span> <strong>{card.fatherName}</strong>
        </div>
        <div>
          <span>Mother&apos;s Name :</span> <strong>{card.motherName}</strong>
        </div>
        <div className="rc-span2">
          <span>Academic Year :</span> <strong>{card.yearLabel}</strong>
        </div>
      </div>

      <h3 className="rc-section">PART – A : SCHOLASTIC AREAS</h3>
      <table className="rc-table rc-exam-table">
        <thead>
          <tr>
            <th style={{ width: "10%" }}>Sl. No.</th>
            <th>Subject</th>
            <th style={{ width: "18%" }}>
              Marks
              <span className="block text-[8pt] font-normal">/{card.max}</span>
            </th>
            <th style={{ width: "18%" }}>Grade</th>
          </tr>
        </thead>
        <tbody>
          {card.partA.map((row) => (
            <tr key={row.sl}>
              <td>{row.sl}</td>
              <td className="rc-left">{row.subject}</td>
              <td>{row.marks}</td>
              <td>{row.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {card.partB?.length ? (
        <>
          <h3 className="rc-section">PART – B : CO-SCHOLASTIC AREAS</h3>
          <table className="rc-table rc-exam-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th style={{ width: "18%" }}>
                  Marks
                  <span className="block text-[8pt] font-normal">/{card.max}</span>
                </th>
                <th style={{ width: "18%" }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {card.partB.map((row) => (
                <tr key={row.subject}>
                  <td className="rc-left">{row.subject}</td>
                  <td>{row.marks}</td>
                  <td>{row.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      <div className="rc-auth">
        <div>Signature of Class Teacher</div>
        <div>Signature of H.M.</div>
        <div>Signature of Parent</div>
        <div className="rc-barcode-row">
          {card.verificationCode ? (
            <Barcode value={card.verificationCode} />
          ) : (
            <div className="rc-barcode-placeholder">Barcode after approval</div>
          )}
        </div>
      </div>

      <footer className="rc-footer">
        <div className="rc-wave rc-wave-bottom" aria-hidden />
        <p>“{card.school.footerQuote}”</p>
      </footer>
    </article>
  );
}
