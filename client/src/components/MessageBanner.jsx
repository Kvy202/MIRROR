// A confession the last crowd sealed for whoever arrives next. You see the
// words — but are never told whether they left you the truth, or a kind lie.
export default function MessageBanner({ message }) {
  if (!message?.text) return null;
  return (
    <div className="msgbanner">
      <span className="msgbanner__tag">THE LAST SOUL LEFT YOU THIS</span>
      <span className="msgbanner__text">“{message.text}”</span>
    </div>
  );
}
