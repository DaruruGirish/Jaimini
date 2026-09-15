import type { CardView } from "@/lib/card";
import Barcode from "./Barcode";
import "./report-card.css";

export default function ReportCard({ card }: { card: CardView }) {
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

      <h2 className="rc-title">ACADEMIC REPORT CARD</h2>
      <p className="rc-subtitle">
        First Term &amp; Second Term &nbsp;|&nbsp; {card.yearLabel}
      </p>

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

      <h3 className="rc-section">PART A (Scholastic Areas)</h3>
      <table className="rc-table">
        <thead>
          <tr>
            <th rowSpan={2} className="rc-sl">
              SL
              <br />
              No.
            </th>
            <th rowSpan={2}>Subject</th>
            <th colSpan={7}>First Term / Semester</th>
            <th colSpan={7}>Second Term / Semester</th>
            <th rowSpan={2} className="rc-gt">
              Grand
              <br />
              Total
              <br />
              (100)
            </th>
            <th rowSpan={2}>Grade</th>
          </tr>
          <tr>
            <th>FA-I (15)</th>
            <th>Grade</th>
            <th>FA-II (15)</th>
            <th>Grade</th>
            <th>SA-I (20)</th>
            <th>Total (50%)</th>
            <th>Grade</th>
            <th>FA-III (15)</th>
            <th>Grade</th>
            <th>FA-IV (15)</th>
            <th>Grade</th>
            <th>SA-II (20)</th>
            <th>Total (50%)</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {card.partA.map((row) => (
            <tr key={row.sl}>
              <td>{row.sl}</td>
              <td className="rc-left">{row.subject}</td>
              <td>{row.fa1}</td>
              <td>{row.fa1g}</td>
              <td>{row.fa2}</td>
              <td>{row.fa2g}</td>
              <td>{row.sa1}</td>
              <td>{row.t1}</td>
              <td>{row.t1g}</td>
              <td>{row.fa3}</td>
              <td>{row.fa3g}</td>
              <td>{row.fa4}</td>
              <td>{row.fa4g}</td>
              <td>{row.sa2}</td>
              <td>{row.t2}</td>
              <td>{row.t2g}</td>
              <td>{row.grand}</td>
              <td>{row.grandg}</td>
            </tr>
          ))}
          <tr className="rc-sign-row">
            <td>6</td>
            <td className="rc-left">Class Teacher Sign.</td>
            {Array.from({ length: 16 }).map((_, i) => (
              <td key={i}>&nbsp;</td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="rc-split">
        <div className="rc-box">
          <h3>PART B (Co-Scholastic Areas)</h3>
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>FA-01</th>
                <th>FA-02</th>
                <th>SA-01</th>
                <th>FA-03</th>
                <th>FA-04</th>
                <th>SA-02</th>
                <th>Total (100)</th>
              </tr>
            </thead>
            <tbody>
              {card.partB.map((row) => (
                <tr key={row.subject}>
                  <td className="rc-left">{row.subject}</td>
                  <td>{row.fa01}</td>
                  <td>{row.fa02}</td>
                  <td>{row.sa01}</td>
                  <td>{row.fa03}</td>
                  <td>{row.fa04}</td>
                  <td>{row.sa02}</td>
                  <td>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rc-box">
          <h3>Attendance</h3>
          <table>
            <thead>
              <tr>
                <th>Particulars</th>
                <th>Semester-1</th>
                <th>Semester-2</th>
                <th>Percentage (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="rc-left">School working days</td>
                <td>{card.attendance.workS1}</td>
                <td>{card.attendance.workS2}</td>
                <td></td>
              </tr>
              <tr>
                <td className="rc-left">Student no. of day present</td>
                <td>{card.attendance.presentS1}</td>
                <td>{card.attendance.presentS2}</td>
                <td>
                  {card.attendance.pctS1} / {card.attendance.pctS2}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p className="rc-remarks">
        <strong>Remarks :</strong> {card.remarks || "________________________________"}
      </p>

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
