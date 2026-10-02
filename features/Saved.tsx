import React from "react";
import { View } from "react-native";
import { CityService, SavedGroup } from "../types";
import { services } from "../data/catalog";
import { useApp } from "../hooks/useApp";
import { Chip, Empty, Txt } from "../components/ui";
import { ServiceCard } from "../components/ServiceCard";

const groups: SavedGroup[] = [
  "Ders çalışma",
  "Yemek",
  "Kariyer",
  "Sonra bakacağım",
];
export function Saved({
  onDetail,
  onDiscover,
}: {
  onDetail: (s: CityService) => void;
  onDiscover: () => void;
}) {
  const { saved, moveSaved } = useApp();
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 8 }}>
        <Txt size={12} weight="700" muted>
          KENDİ ŞEHİR REHBERİN
        </Txt>
        <Txt accessibilityRole="header" size={36} weight="700">
          Kaydettiklerin
        </Txt>
        <Txt muted>Sevdiğin yerler, tek bir listede.</Txt>
      </View>
      {!saved.length && (
        <Empty
          title="İlk adresini buraya bırak."
          description="Hizmetlerin yanındaki yer imi simgesine dokun. Sonra kendi listelerinde düzenleyebilirsin."
          action="Bir hizmet keşfet"
          onPress={onDiscover}
        />
      )}
      {groups.map((group) => {
        const entries = saved.filter((e) => e.group === group);
        return entries.length ? (
          <View key={group} style={{ gap: 14 }}>
            <Txt size={21} weight="700">
              {group}{" "}
              <Txt size={14} muted>
                {" "}
                / {entries.length}
              </Txt>
            </Txt>
            {entries.map((entry) => {
              const s = services.find((v) => v.id === entry.id);
              return s ? (
                <View key={s.id} style={{ gap: 8 }}>
                  <ServiceCard
                    service={s}
                    compact
                    onPress={() => onDetail(s)}
                  />
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}
                  >
                    {groups
                      .filter((g) => g !== group)
                      .map((g) => (
                        <Chip
                          key={g}
                          label={`${g} listesine taşı`}
                          onPress={() => moveSaved(s.id, g)}
                        />
                      ))}
                  </View>
                </View>
              ) : null;
            })}
          </View>
        ) : null;
      })}
    </View>
  );
}
