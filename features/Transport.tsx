import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, View } from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { CityService } from "../types";
import { Arrival, EgoLine, Schedule } from "../types/transport";
import { useApp } from "../hooks/useApp";
import { useEgo } from "../hooks/useEgo";
import { useTransportClock } from "../hooks/useTransportClock";
import { useTheme } from "../theme";
import { Badge, Button, Chip, Icon, Txt } from "../components/ui";
import { directionsUrl, egoProvider, searchStops } from "../services/transport";
import { normalize } from "../services/matching";
import {
  getDestinationAccess,
  searchDestinations,
} from "../services/destinationAccess";
import {
  arrivalResponseFresh,
  remainingDepartures,
  scheduleDay,
} from "../services/transportTime";
import { ankaraTime } from "../utils/time";
import { openLink } from "../utils/links";

type TransportTarget = Pick<
  CityService,
  | "id"
  | "name"
  | "address"
  | "latitude"
  | "longitude"
  | "coordinatesApproximate"
>;
type Panel = "route" | "stop" | "line";
function FetchState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error?: string;
  retry: () => void;
}) {
  return (
    <>
      {loading && (
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <ActivityIndicator />
          <Txt size={13} muted>
            Güncel bilgi alınıyor…
          </Txt>
        </View>
      )}
      {error && (
        <View style={{ gap: 10 }}>
          <Txt accessibilityRole="alert" size={14}>
            {error}
          </Txt>
          <Button variant="secondary" label="Tekrar dene" onPress={retry} />
        </View>
      )}
    </>
  );
}
const stamp = (date: string) =>
  new Date(date).toLocaleTimeString("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export function Transport({ service }: { service: TransportTarget }) {
  const { colors, scale } = useTheme();
  const { profile, setProfile, setNotice } = useApp();
  const scroll = useRef<ScrollView>(null);
  const [panel, setPanel] = useState<Panel>("route");
  const [stopQuery, setStopQuery] = useState("");
  const [stop, setStop] = useState("");
  const [lineQuery, setLineQuery] = useState("");
  const [line, setLine] = useState("");
  const [dayChoice, setDayChoice] = useState<{
    date: string;
    index: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [showAllStops, setShowAllStops] = useState(false);
  const [showAllDepartures, setShowAllDepartures] = useState(false);
  const [showPlanned, setShowPlanned] = useState(false);
  const [showTargetSearch, setShowTargetSearch] = useState(false);
  const [targetQuery, setTargetQuery] = useState("");
  const [expandedStops, setExpandedStops] = useState<string[]>([]);
  const { clock, active, epoch } = useTransportClock();
  const realNow = new Date(clock);
  const today = ankaraTime(realNow).date;
  const todayIndex = scheduleDay(realNow);
  const day = dayChoice?.date === today ? dayChoice.index : todayIndex;
  const access = getDestinationAccess(service.id);
  const targetMatches = searchDestinations(targetQuery);
  const lines = useEgo<EgoLine[]>(
    panel === "line" ? "lines" : "",
    (signal) => egoProvider.lines(signal),
    { active },
  );
  const schedule = useEgo<Schedule>(
    panel === "line" ? line : "",
    (signal) => egoProvider.schedule(line, signal),
    { active, epoch },
  );
  const arrivals = useEgo<Arrival[]>(
    panel === "stop" ? stop : "",
    (signal) => egoProvider.arrivals(stop, signal),
    { active, epoch, pollMs: 30000, retainWhileRefreshing: true },
  );
  const matches = stopQuery !== stop ? searchStops(stopQuery) : [];
  const matchingLines =
    lineQuery.trim() && lineQuery !== line
      ? (lines.data?.data
          .filter((entry) =>
            normalize(`${entry.code} ${entry.name}`).includes(
              normalize(lineQuery),
            ),
          )
          .slice(0, 5) ?? [])
      : [];
  const fresh =
    active &&
    !!arrivals.data &&
    arrivalResponseFresh(arrivals.data.fetchedAt, Date.now());
  const liveArrivals = fresh
    ? arrivals
        .data!.data.filter(
          (entry) => entry.kind === "live" && entry.minutes !== null,
        )
        .sort((a, b) => (a.minutes ?? Infinity) - (b.minutes ?? Infinity))
    : [];
  const plannedArrivals = fresh
    ? arrivals.data!.data.filter((entry) => entry.kind === "scheduled")
    : [];
  const allDepartures = schedule.data?.data.days[day]?.departures ?? [];
  const departures =
    day === todayIndex && !showAllDepartures
      ? remainingDepartures(allDepartures, realNow)
      : allDepartures;
  const card = {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  } as const;
  const input = {
    color: colors.ink,
    backgroundColor: colors.bg,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 54,
    padding: 15,
    fontSize: 16 * scale,
  };
  const open = (url: string) => {
    void openLink(url, setNotice);
  };
  function showPanel(value: Panel) {
    setPanel(value);
    scroll.current?.scrollTo({ y: 0, animated: true });
  }
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [panel]);
  function chooseLine(code: string) {
    setLine(code);
    setLineQuery(code);
    setShowAllStops(false);
    setShowAllDepartures(false);
    setDayChoice(null);
    showPanel("line");
  }
  function chooseStop(code: string) {
    setStop(code);
    setStopQuery(code);
    setShowPlanned(false);
    showPanel("stop");
  }
  async function locate() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setNotice("Konum izni verilmedi. Haritada başlangıç seçebilirsin.");
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setProfile({
        ...profile,
        location: {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        },
      });
    } catch {
      setNotice("Konum alınamadı. Haritada başlangıç seçebilirsin.");
    } finally {
      setLocating(false);
    }
  }
  return (
    <ScrollView
      ref={scroll}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 48,
        gap: 20,
        width: "100%",
        maxWidth: 760,
        alignSelf: "center",
      }}
    >
      <Button
        label="Geri"
        variant="ghost"
        icon="arrow-back"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/discover")
        }
      />
      <View style={{ gap: 7 }}>
        <Txt size={30} weight="700" accessibilityRole="header">
          Nasıl giderim?
        </Txt>
        <Txt size={18} weight="600">
          {service.name}
        </Txt>
        <Txt size={13} muted>
          {access?.address ?? service.address}
        </Txt>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Chip
          label="Ulaşım"
          selected={panel === "route"}
          onPress={() => showPanel("route")}
        />
        <Chip
          label="Durak"
          selected={panel === "stop"}
          onPress={() => showPanel("stop")}
        />
        <Chip
          label="Hat"
          selected={panel === "line"}
          onPress={() => showPanel("line")}
        />
      </View>
      {panel === "route" && (
        <>
          {access && (
            <View style={card}>
              <View
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <Icon name="bus-outline" />
                <Txt size={20} weight="700">
                  Yakındaki duraklar
                </Txt>
              </View>
              {access.busStops.map((destinationStop) => (
                <View key={destinationStop.code} style={{ gap: 10 }}>
                  <Txt size={16} weight="700">
                    {destinationStop.name} · {destinationStop.code}
                  </Txt>
                  <Txt size={13} muted>
                    {destinationStop.position}
                  </Txt>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {destinationStop.lines
                      .slice(
                        0,
                        expandedStops.includes(destinationStop.code)
                          ? undefined
                          : 4,
                      )
                      .map((bus) => (
                        <Chip
                          key={bus.code}
                          label={`Otobüs ${bus.code}`}
                          onPress={() => chooseLine(bus.code)}
                        />
                      ))}
                  </View>
                  {destinationStop.lines.length > 4 && (
                    <Button
                      label={
                        expandedStops.includes(destinationStop.code)
                          ? "Daha az hat"
                          : `Diğer hatlar (${destinationStop.lines.length - 4})`
                      }
                      variant="ghost"
                      onPress={() =>
                        setExpandedStops((current) =>
                          current.includes(destinationStop.code)
                            ? current.filter(
                                (code) => code !== destinationStop.code,
                              )
                            : [...current, destinationStop.code],
                        )
                      }
                    />
                  )}
                  <Button
                    label={`${destinationStop.code} · Yaklaşan otobüsler`}
                    variant="secondary"
                    onPress={() => chooseStop(destinationStop.code)}
                  />
                </View>
              ))}
              {access.rail.map((rail) => (
                <View key={rail.code} style={{ gap: 5 }}>
                  <Badge text={rail.code} />
                  <Txt size={17} weight="600">
                    {rail.station} istasyonunda in
                  </Txt>
                  <Txt size={13} muted>
                    {rail.name}
                  </Txt>
                </View>
              ))}
              <Txt size={12} muted>
                Biniş ve aktarma başlangıç konumuna göre değişir.
                {access.busStops.some(
                  (entry) => entry.distanceMeters !== undefined,
                )
                  ? " Mesafeler kuş uçuşudur."
                  : ""}
              </Txt>
              <Txt size={11} muted>
                Hat kontrolü: {access.checkedAt}
              </Txt>
              <Button
                label="Ulaşım kaynağı"
                variant="ghost"
                icon="open-outline"
                onPress={() => open(access.sourceUrl)}
              />
            </View>
          )}
          <View style={card}>
            <Txt size={20} weight="700">
              Rotayı aç
            </Txt>
            {!access && (
              <Txt size={13} muted>
                Bu hedefin otobüs bilgisi henüz doğrulanmadı. Tam rotayı
                haritada görebilirsin.
              </Txt>
            )}
            {service.latitude === null && !access && (
              <Txt size={13} muted>
                Önce hizmet detayından katılacağın merkezi seç.
              </Txt>
            )}
            {!profile.location && (
              <Button
                label={
                  locating
                    ? "Konum alınıyor…"
                    : "Başlangıç için konumumu kullan"
                }
                variant="secondary"
                disabled={locating}
                icon="locate-outline"
                onPress={() => {
                  void locate();
                }}
              />
            )}
            <Button
              label="Toplu taşımayla rota"
              icon="bus-outline"
              disabled={service.latitude === null && !access}
              onPress={() => open(directionsUrl(service, profile.location))}
            />
            <Button
              label="Yürüyerek rota"
              variant="secondary"
              icon="walk-outline"
              disabled={service.latitude === null && !access}
              onPress={() =>
                open(directionsUrl(service, profile.location, "walking"))
              }
            />
            <Txt size={12} muted>
              Başlangıç ve aktarmalar Google Haritalar’da açılır.
            </Txt>
          </View>
          <Button
            label={
              showTargetSearch ? "Hedef aramasını kapat" : "Başka bir hedef ara"
            }
            variant="secondary"
            icon="search-outline"
            onPress={() => setShowTargetSearch((value) => !value)}
          />
          {showTargetSearch && (
            <View style={card}>
              <TextInput
                accessibilityLabel="Ulaşım hedefi ara"
                value={targetQuery}
                onChangeText={setTargetQuery}
                placeholder="Cumhurbaşkanlığı, AŞTİ…"
                placeholderTextColor={colors.muted}
                style={input}
              />
              {targetMatches.map((target) => (
                <Button
                  key={target.id}
                  label={target.name}
                  variant="secondary"
                  onPress={() =>
                    router.replace({
                      pathname: "/transport/[id]",
                      params: { id: target.serviceIds[0] ?? target.id },
                    })
                  }
                />
              ))}
              {targetQuery.trim().length >= 2 && !targetMatches.length && (
                <Txt size={13} muted>
                  Doğrulanmış ulaşım kaydı bulunamadı.
                </Txt>
              )}
            </View>
          )}
        </>
      )}
      {panel === "line" && (
        <View style={card} accessibilityLiveRegion="polite">
          <Txt size={20} weight="700">
            {line && lineQuery === line
              ? `${line} · Sefer saatleri`
              : "Hat ara"}
          </Txt>
          <TextInput
            accessibilityLabel="EGO hat numarası veya güzergâh ara"
            value={lineQuery}
            onChangeText={setLineQuery}
            placeholder="481, Kızılay, Balgat…"
            placeholderTextColor={colors.muted}
            style={input}
            autoCorrect={false}
          />
          {lineQuery !== line && <FetchState {...lines} />}
          {/^[0-9]{2,4}(?:-[0-9]{1,2})?$/.test(lineQuery.trim()) &&
            lineQuery !== line &&
            !matchingLines.some((entry) => entry.code === lineQuery.trim()) && (
              <Button
                label={`${lineQuery.trim()} numaralı hattı sorgula`}
                onPress={() => chooseLine(lineQuery.trim())}
              />
            )}
          {matchingLines.map((entry) => (
            <Button
              key={entry.code}
              label={entry.name}
              variant="secondary"
              onPress={() => chooseLine(entry.code)}
            />
          ))}
          {!!lineQuery.trim() &&
            lineQuery !== line &&
            lines.data &&
            !matchingLines.length && (
              <Txt size={13} muted>
                Bu aramayla eşleşen hat yok.
              </Txt>
            )}
          {lineQuery === line && <FetchState {...schedule} />}
          {lineQuery === line && schedule.data && (
            <>
              <Txt size={17} weight="700">
                {schedule.data.data.name}
              </Txt>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                {schedule.data.data.days.map((entry, index) => (
                  <Chip
                    key={entry.label}
                    label={`${entry.label}${index === todayIndex ? " · Bugün" : ""}`}
                    selected={day === index}
                    onPress={() => {
                      setDayChoice({ date: today, index });
                      setShowAllDepartures(false);
                    }}
                  />
                ))}
              </View>
              <Txt size={14} weight="600">
                {day === todayIndex && !showAllDepartures
                  ? "Bugünün kalan kalkışları"
                  : "Tüm kalkışlar"}
              </Txt>
              <Txt size={12} muted>
                İlk duraktan kalkış saatidir; bu durağa varış değildir.
              </Txt>
              {departures.length ? (
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}
                >
                  {departures
                    .slice(0, showAllDepartures ? undefined : 8)
                    .map((entry, index) => (
                      <View
                        key={`${entry.time}-${index}`}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          backgroundColor: colors.bg,
                          gap: 5,
                        }}
                      >
                        <Txt size={19} weight="700">
                          {entry.time}
                        </Txt>
                        {!!entry.note && (
                          <Txt size={12} muted style={{ maxWidth: 230 }}>
                            {entry.note}
                          </Txt>
                        )}
                      </View>
                    ))}
                </View>
              ) : (
                <Txt size={14}>
                  {day === todayIndex && allDepartures.length
                    ? "Bugün için başka kalkış görünmüyor."
                    : "Bu gün için yayımlanmış saat bulunamadı."}
                </Txt>
              )}
              {(showAllDepartures ||
                allDepartures.length > 8 ||
                (day === todayIndex &&
                  allDepartures.length !== departures.length)) && (
                <Button
                  label={
                    showAllDepartures
                      ? "Kısa listeye dön"
                      : `Tüm saatler (${allDepartures.length})`
                  }
                  variant="ghost"
                  onPress={() => setShowAllDepartures((value) => !value)}
                />
              )}
              <Button
                label={
                  showAllStops
                    ? "Güzergâhı gizle"
                    : `Güzergâh durakları (${schedule.data.data.stops.length})`
                }
                variant="secondary"
                onPress={() => setShowAllStops((value) => !value)}
              />
              {showAllStops && (
                <Txt size={13} muted>
                  {schedule.data.data.origin} → {schedule.data.data.destination}
                </Txt>
              )}
              {showAllStops &&
                schedule.data.data.stops.map((entry, index) => (
                  <Button
                    key={`${entry.code}-${index}`}
                    label={`${entry.order}. ${entry.code} · ${entry.name}`}
                    variant="secondary"
                    onPress={() => chooseStop(entry.code)}
                  />
                ))}
              <Button
                label="Seferleri yenile"
                variant="ghost"
                onPress={schedule.retry}
              />
            </>
          )}
        </View>
      )}
      {panel === "stop" && (
        <View style={card} accessibilityLiveRegion="polite">
          <Txt size={20} weight="700">
            {stop && stopQuery === stop
              ? `${stop} · Yaklaşan otobüsler`
              : "Durak ara"}
          </Txt>
          <TextInput
            accessibilityLabel="EGO durak adı veya numarası"
            value={stopQuery}
            onChangeText={setStopQuery}
            placeholder="Güvenpark veya 12219…"
            placeholderTextColor={colors.muted}
            style={input}
            autoCorrect={false}
          />
          {matches.map((entry) => (
            <Button
              key={entry.code}
              label={`${entry.code} · ${entry.name}`}
              variant="secondary"
              onPress={() => chooseStop(entry.code)}
            />
          ))}
          {/^[0-9]{5}$/.test(stopQuery) &&
            stopQuery !== stop &&
            !matches.some((entry) => entry.code === stopQuery) && (
              <Button
                label={`${stopQuery} numaralı durağı sorgula`}
                onPress={() => chooseStop(stopQuery)}
              />
            )}
          {!matches.length &&
            stopQuery.length >= 2 &&
            stopQuery !== stop &&
            !/^[0-9]{5}$/.test(stopQuery) && (
              <Txt size={13} muted>
                Yerel listede bulunamadı. Beş haneli durak numarasıyla
                sorgulayabilirsin.
              </Txt>
            )}
          {stopQuery === stop && (
            <>
              <FetchState {...arrivals} />
              {arrivals.data && !fresh && (
                <View style={{ gap: 10 }}>
                  <Txt weight="600">Bilgi güncelliğini kaybetti.</Txt>
                  <Txt size={13} muted>
                    Eski dakika tahminini göstermiyoruz.
                  </Txt>
                  <Button
                    label="Güncel araçları getir"
                    onPress={arrivals.retry}
                  />
                </View>
              )}
              {fresh && (
                <>
                  {!liveArrivals.length && (
                    <View style={{ gap: 5 }}>
                      <Txt size={16} weight="600">
                        Şu an yaklaşan canlı araç görünmüyor.
                      </Txt>
                      <Txt size={13} muted>
                        Hattın sefer saatlerini de kontrol edebilirsin.
                      </Txt>
                    </View>
                  )}
                  {liveArrivals.map((entry, index) => (
                    <View
                      key={`${entry.line}-${index}`}
                      style={{
                        flexDirection: "row",
                        gap: 16,
                        alignItems: "center",
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderColor: colors.line,
                      }}
                    >
                      <View style={{ width: 70 }}>
                        <Txt
                          size={entry.minutes === 0 ? 22 : 34}
                          weight="800"
                          style={{ color: colors.accent }}
                        >
                          {entry.minutes === 0 ? "Geldi" : entry.minutes}
                        </Txt>
                        {entry.minutes !== 0 && (
                          <Txt size={11} muted>
                            DAKİKA
                          </Txt>
                        )}
                      </View>
                      <View style={{ flex: 1, gap: 5 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 8,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <Txt size={20} weight="700">
                            {entry.line}
                          </Txt>
                          {index === 0 && <Badge text="En yakın" warm />}
                        </View>
                        <Txt size={13} muted numberOfLines={2}>
                          {entry.destination}
                        </Txt>
                        <Button
                          label={`${entry.line} · Hat saatleri`}
                          variant="ghost"
                          onPress={() => chooseLine(entry.line)}
                        />
                      </View>
                    </View>
                  ))}
                  {plannedArrivals.length > 0 && (
                    <>
                      <Button
                        label={
                          showPlanned
                            ? "Planlı bilgiyi gizle"
                            : `Planlı bilgi (${plannedArrivals.length})`
                        }
                        variant="ghost"
                        onPress={() => setShowPlanned((value) => !value)}
                      />
                      {showPlanned &&
                        plannedArrivals.map((entry, index) => (
                          <View
                            key={`planned-${entry.line}-${index}`}
                            style={{ gap: 4 }}
                          >
                            <Txt weight="600">{entry.line}</Txt>
                            <Txt size={12} muted>
                              {entry.description.replace(/\s+/g, " ")}
                            </Txt>
                          </View>
                        ))}
                    </>
                  )}
                  <Txt size={11} muted>
                    Güncellendi {stamp(arrivals.data!.fetchedAt)} · 30 sn’de
                    yenilenir.
                  </Txt>
                </>
              )}
              {!!stop && (
                <Button
                  label="Durak bilgisini yenile"
                  variant="secondary"
                  onPress={arrivals.retry}
                />
              )}
            </>
          )}
        </View>
      )}
      <Button
        label="Resmî EGO hareket saatleri"
        variant="ghost"
        icon="open-outline"
        onPress={() => open("https://www.ego.gov.tr/hareketsaatleri")}
      />
      <Txt size={11} muted>
        KentPusula, EGO’nun resmî uygulaması değildir.
      </Txt>
      {panel === "stop" && (
        <Button
          label="Durak verisi · © OpenStreetMap (ODbL)"
          variant="ghost"
          onPress={() => open("https://www.openstreetmap.org/copyright")}
        />
      )}
    </ScrollView>
  );
}
