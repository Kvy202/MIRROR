// The darker twist: a returning soul is shown an answer the crowd gave while it
// was away — the world moved on without it. Dismissable.
export default function AbsenceReveal({ missed, onDismiss }) {
  if (!missed) return null;
  return (
    <div className="absence" onClick={onDismiss}>
      <div className="absence__card" onClick={(e) => e.stopPropagation()}>
        <p className="absence__eyebrow">YOU WEREN’T HERE</p>
        <h2 className="absence__title">Strangers answered for you.</h2>
        <p className="absence__detail">While you were gone, question #{missed.roundNumber} was decided.</p>
        <p className="absence__consequence">{missed.reveal}</p>
        <button className="absence__dismiss" onClick={onDismiss}>
          STEP BACK TO THE MIRROR
        </button>
      </div>
    </div>
  );
}
