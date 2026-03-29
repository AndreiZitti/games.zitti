import { motion } from "framer-motion";
import HsbSlider from "./HsbSlider";
import { hsbToHex } from "../utils/color";

export default function PickerScreen({
  pickerColor,
  onPickerChange,
  round,
  onSubmit,
}) {
  const [h, s, b] = pickerColor;
  const previewHex = hsbToHex(h, s, b);

  const updateChannel = (index) => (val) => {
    const next = [...pickerColor];
    next[index] = val;
    onPickerChange(next);
  };

  return (
    <motion.div
      className="chroma-screen chroma-picker"
      style={{ backgroundColor: previewHex }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="chroma-picker__round">{round}/3</div>

      <motion.div
        className="chroma-picker__sliders"
        initial={{ x: -120, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.33, 1, 0.68, 1] }}
      >
        <HsbSlider
          type="hue"
          value={h}
          onChange={updateChannel(0)}
          hue={h}
          saturation={s}
          brightness={b}
        />
        <HsbSlider
          type="saturation"
          value={s}
          onChange={updateChannel(1)}
          hue={h}
          saturation={s}
          brightness={b}
        />
        <HsbSlider
          type="brightness"
          value={b}
          onChange={updateChannel(2)}
          hue={h}
          saturation={s}
          brightness={b}
        />
      </motion.div>

      <motion.button
        className="chroma-go-btn"
        onClick={onSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.3 }}
      >
        GO
      </motion.button>
    </motion.div>
  );
}
