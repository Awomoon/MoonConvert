import Uploader from "./Uploader";
import FormatSelection from "./FormatSelection";
import ActionButtons from "./ActionButtons";
import ProgressBar from "./ProgressBar";
import Messages from "./Messages";
import DownloadSection from "./DownloadSection";
import RecentConversions from "./RecentConversions";

const ConverterCard = () => {
  return (
    <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <section className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/20">
        <Uploader />
        <FormatSelection />
        <ActionButtons />
        <ProgressBar />
        <Messages />
        <DownloadSection />
      </section>

      <RecentConversions />
    </main>
  );
};

export default ConverterCard;
