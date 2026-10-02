import React from "react";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";

export function CompassMark({
  size = 38,
  color = "#B84123",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      accessibilityLabel="KentPusula logosu"
    >
      <Path d="M24 2L42 40 24 32 6 40Z" fill={color} />
      <Path d="M24 12V32L34 36Z" fill="#F5F3ED" />
      <Path d="M10 44H38" stroke={color} strokeWidth="3" />
    </Svg>
  );
}
export function CityIllustration({ height = 250 }: { height?: number }) {
  return (
    <Svg
      width="100%"
      height={height}
      viewBox="0 0 500 290"
      accessibilityLabel="Ankara silüeti ve durakları bağlayan temsili rota"
    >
      <G stroke="#698371" strokeWidth="1" opacity=".35">
        <Line x1="0" y1="70" x2="500" y2="70" />
        <Line x1="0" y1="140" x2="500" y2="140" />
        <Line x1="0" y1="210" x2="500" y2="210" />
        {[60, 140, 220, 300, 380, 460].map((x) => (
          <Line key={x} x1={x} y1="0" x2={x} y2="290" />
        ))}
      </G>
      <Circle cx="378" cy="85" r="56" fill="#3B5546" />
      <G fill="#526A53">
        <Rect x="23" y="148" width="60" height="66" />
        <Rect x="91" y="120" width="34" height="94" />
        <Rect x="132" y="158" width="64" height="56" />
        <Path d="M217 214V90L229 75 241 90V214Z" />
        <Rect x="269" y="141" width="68" height="73" />
        <Rect x="347" y="156" width="40" height="58" />
        <Rect x="404" y="126" width="65" height="88" />
      </G>
      <G fill="none" stroke="#D7DDC4" strokeWidth="2">
        <Path d="M205 210L228 28 252 210M212 153H245M214 128H242M218 105H238M199 70Q228 46 258 70M207 57H249M221 34H235" />
        <Path d="M284 141V129H324V141M293 129V108H316V129" />
      </G>
      <Path
        d="M40 244H121Q145 244 145 222V207Q145 186 168 186H305Q326 186 326 162V101Q326 82 347 82H421"
        fill="none"
        stroke="#F3A779"
        strokeWidth="5"
      />
      <G fill="#F2EEDD" stroke="#243D34" strokeWidth="5">
        <Circle cx="66" cy="244" r="9" />
        <Circle cx="194" cy="186" r="9" />
        <Circle cx="326" cy="122" r="9" />
        <Circle cx="419" cy="82" r="9" />
      </G>
      <SvgText x="31" y="276" fill="#CED6C7" fontSize="11" letterSpacing="2">
        ŞEHİR SENİNLE.
      </SvgText>
      <SvgText x="356" y="57" fill="#F2EEDD" fontSize="10" letterSpacing="2">
        ANKARA / 06
      </SvgText>
    </Svg>
  );
}
