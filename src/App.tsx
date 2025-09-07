
import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Pressable, TextInput, ScrollView, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import contentData from '../data/content.json';

type Para = { type: 'text' | 'author' | 'quote_ref'; text: string };
type Item = { title: string; content: Para[] };
type SectionT = { title: string; items: Item[] };

const Stack = createNativeStackNavigator();

type ThemeMode = 'light' | 'dark';
const ThemeContext = React.createContext<{ mode: ThemeMode, setMode: (m: ThemeMode) => void }>({
  mode: 'light',
  setMode: () => {}
});
function useEffectiveScheme() {
  const { mode } = React.useContext(ThemeContext);
  return mode as 'light' | 'dark';
}

function SettingsPanel({ visible, onClose, fontSize, setFontSize, fontFamily, setFontFamily }: any) {
  if (!visible) return null;
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#5A0A17', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
      <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Настройки</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: '#f3f4f6', width: 120 }}>Размер шрифта</Text>
        <Pressable onPress={() => setFontSize(Math.max(14, fontSize - 1))} style={{ backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8 }}>
          <Text style={{ color: '#fff' }}>–</Text>
        </Pressable>
        <Text style={{ color: '#fff', minWidth: 40, textAlign: 'center' }}>{fontSize}</Text>
        <Pressable onPress={() => setFontSize(Math.min(30, fontSize + 1))} style={{ backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8 }}>
          <Text style={{ color: '#fff' }}>+</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: '#f3f4f6', width: 120 }}>Шрифт</Text>
        {['System', 'Serif'].map(ff => (
          <Pressable key={ff} onPress={() => setFontFamily(ff as any)} style={{ backgroundColor: fontFamily === ff ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 8 }}>
            <Text style={{ color: '#fff' }}>{ff}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: '#f3f4f6', width: 120 }}>Тема</Text>
        <ThemeSelector />
      </View>

      <Pressable onPress={onClose} style={{ alignSelf: 'flex-end', backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}>
        <Text style={{ color: '#fff' }}>Готово</Text>
      </Pressable>
    </View>
  );
}

function useSections(): SectionT[] {
  const sections = (contentData as any).sections as SectionT[] | undefined;
  if (sections && Array.isArray(sections)) return sections;
  return (contentData as any) as unknown as SectionT[];
}

function ThemeSelector() {
  const { mode, setMode } = React.useContext(ThemeContext);
  const options: {key: ThemeMode, label: string}[] = [
    { key: 'light', label: 'Светлая' },
    { key: 'dark', label: 'Тёмная' },
  ];
  return (
    <View style={{ flexDirection: 'row' }}>
      {options.map(opt => (
        <Pressable
          key={opt.key}
          onPress={() => setMode(opt.key)}
          style={{ backgroundColor: mode === opt.key ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 8 }}
        >
          <Text style={{ color: '#fff' }}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const HomeScreen = ({ navigation }: any) => {
  const scheme = useEffectiveScheme();
  const sections = useSections();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      {sections.map((s) => {
        const expanded = expandedId === s.title;
        return (
          <View key={s.title} style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden' }}>
            <Pressable
              onPress={() => setExpandedId(expanded ? null : s.title)}
              style={{
                backgroundColor: scheme === 'dark' ? '#3c3c3b' : '#E6F3FF',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: expanded ? 1 : 0,
                borderBottomColor: scheme === 'dark' ? '#2b2b2a' : '#DCE7F3',
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '700', color: scheme === 'dark' ? '#FFF7F7' : '#0B3C5D' }}>
                {s.title}
              </Text>
            </Pressable>

            {expanded && (
              <View style={{ backgroundColor: scheme === 'dark' ? '#0B0F14' : '#FFFFFF' }}>
                {(s.items || []).map((it, i) => (
                  <Pressable
                    key={it.title + i}
                    onPress={() => navigation.navigate('Chapter', { item: it, sectionTitle: s.title })}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: scheme === 'dark' ? '#1f2937' : '#E5E7EB',
                    }}
                  >
                    <Text style={{ fontSize: 16, color: scheme === 'dark' ? '#E5E7EB' : '#1F2937' }}>{it.title}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      })}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const SearchScreen = ({ navigation }: any) => {
  const scheme = useEffectiveScheme();
  const sections = useSections();
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const res: { sectionTitle: string; item: Item }[] = [];
    const qq = q.trim().toLowerCase();
    if (!qq) return res;
    sections.forEach((s) => (s.items || []).forEach((it) => {
      const text = (it.content || []).map((p) => p.text).join('\n').toLowerCase();
      if (text.includes(qq) || it.title.toLowerCase().includes(qq)) res.push({ sectionTitle: s.title, item: it });
    }));
    return res;
  }, [q, sections]);

  return (
    <View style={{ flex: 1, backgroundColor: scheme === 'dark' ? '#000' : '#fff' }}>
      <TextInput
        placeholder="Поиск по книге"
        placeholderTextColor={scheme === 'dark' ? '#888' : '#666'}
        value={q}
        onChangeText={setQ}
        style={{
          margin: 16,
          padding: 12,
          borderRadius: 8,
          backgroundColor: scheme === 'dark' ? '#111' : '#f2f4f7',
          color: scheme === 'dark' ? '#fff' : '#000',
        }}
      />
      <ScrollView>
        {results.map((r, idx) => (
          <Pressable
            key={idx}
            onPress={() => navigation.navigate('Chapter', { item: r.item, sectionTitle: r.sectionTitle })}
            style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: scheme === 'dark' ? '#222' : '#eee' }}
          >
            <Text style={{ color: scheme === 'dark' ? '#fff' : '#000', fontSize: 16 }}>{r.item.title}</Text>
            <Text numberOfLines={2} style={{ color: scheme === 'dark' ? '#aaa' : '#666', marginTop: 4 }}>
              {(r.item.content || []).map((p) => p.text).join(' ').slice(0, 200)}
            </Text>
          </Pressable>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const ChapterScreen = ({ route }: any) => {
  const { sectionTitle, item } = route.params;
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState<'System' | 'Serif'>('System');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scheme = useEffectiveScheme();
  const fontMap: any = { System: undefined, Serif: 'serif' };

  const isAuthor = (text: string) => {
    const t = text.trim();

    const hasYears = /\(\s*\d{3,4}\s*[-–]\s*\d{2,4}\s*\)/.test(t);
    const hasCentury = /\((?:[IVXLC]+|\d{1,2})\s*век\)?/i.test(t);
    const hasDagger = /†\s*\d{3,4}/.test(t);
    const hasBorn = /(р\.\s*в\.?|род\.)\s*\d{3,4}/i.test(t);
    const isProverb = /Русская\s+пословица/i.test(t);
    const isUnknownElder = /Неизвестный\s+старец.*Отечник/i.test(t);

    // Простая проверка на ссылку вида "Иез. 33, 19" (возможны скобки по краям)
    const bibleRef = /^\(?\s*(?:[1-3]\s*)?[А-ЯЁ][а-яё]+\.?\s*\d+\s*[:,]\s*\d+(?:\s*[-–]\s*\d+)?(?:\s*,\s*\d+)*\s*\)?\.?\s*$/.test(t);

    return isProverb || isUnknownElder || hasYears || hasCentury || hasDagger || hasBorn || bibleRef;
  };

  return (
    <View style={{ flex: 1, backgroundColor: scheme === 'dark' ? '#000' : '#fff' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text style={{ color: scheme === 'dark' ? '#fff' : '#000', fontSize: 22, fontWeight: '600', marginBottom: 8 }}>{item.title}</Text>

        {(item.content || []).map((p: Para, idx: number) => {
          const text = (p.text || '').trim();
          let style: any = {
            fontSize,
            color: scheme === 'dark' ? '#ddd' : '#222',
            lineHeight: fontSize * 1.5,
            marginBottom: 12,
            fontFamily: fontMap[fontFamily],
          };
          if (isAuthor(text)) {
            style = {
              ...style,
              fontSize: fontSize - 3,
              fontStyle: 'italic',
              color: scheme === 'dark' ? '#93C5FD' : '#0B6BBD',
              lineHeight: Math.max((fontSize - 3) * 1.5 * 0.8, (fontSize - 3) * 1.2),
              marginTop: 4,
              marginBottom: 36
            };
          }
          return <Text key={idx} style={style}>{p.text}</Text>;
        })}

        <SectionNavigator sectionTitle={sectionTitle} currentTitle={item.title} />

        <View style={{ marginTop: 16 }}>
          <Text onPress={() => Linking.openURL('https://orthopsy.ru/')} style={{ fontSize: fontSize - 2, color: scheme === 'dark' ? '#666' : '#888', textDecorationLine: 'underline' }}>
            Сост. Д.Г. Семеник orthopsy.ru
          </Text>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', right: 16, bottom: 16 }}>
        <Pressable onPress={() => setSettingsOpen(true)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, backgroundColor: scheme === 'dark' ? '#222' : '#0B3C5D' }}>
          <Text style={{ color: '#fff' }}>Aa</Text>
        </Pressable>
      </View>

      <SettingsPanel
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        fontSize={fontSize}
        setFontSize={setFontSize}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
      />
    </View>
  );
};

function SectionNavigator({ sectionTitle, currentTitle }: { sectionTitle: string; currentTitle: string }) {
  const navigation = (require('@react-navigation/native') as any).useNavigation();
  const scheme = useEffectiveScheme();
  const sections: SectionT[] = useSections();
  const section = sections.find(s => s.title === sectionTitle);
  const items = section?.items || [];
  const idx = items.findIndex(it => it.title === currentTitle);
  const prev = idx > 0 ? items[idx - 1] : null;
  const next = idx >= 0 && idx < items.length - 1 ? items[idx + 1] : null;

  const Btn = ({ onPress, disabled, isRight }: any) => (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginHorizontal: 6,
        opacity: disabled ? 0.4 : 1
      }}
    >
      <View style={{
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: scheme === 'dark' ? '#222' : '#f2f2f7',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <Text style={{ fontSize: 34, lineHeight: 38, color: '#8A8A8A' }}>{isRight ? '▶' : '◀'}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={{ flexDirection: 'row', marginTop: 24, marginBottom: 8, paddingHorizontal: 4 }}>
      <Btn disabled={!prev} onPress={() => navigation.navigate('Chapter', { item: prev, sectionTitle })} isRight={false} />
      <Btn disabled={!next} onPress={() => navigation.navigate('Chapter', { item: next, sectionTitle })} isRight={true} />
    </View>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = React.useState<ThemeMode>('light');
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('themeMode');
        if (saved === 'light' || saved === 'dark') setThemeMode(saved as ThemeMode);
      } catch {}
    })();
  }, []);
  const setMode = (m: ThemeMode) => { setThemeMode(m); AsyncStorage.setItem('themeMode', m).catch(()=>{}); };
  const effective = themeMode as 'light' | 'dark';

  return (
    <ThemeContext.Provider value={{ mode: themeMode, setMode }}>
      <NavigationContainer theme={effective === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#5A0A17' },
            headerTintColor: '#ffffff',
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={({navigation}) => ({
              title: 'Душевный лекарь',
              headerRight: () => (
                <Pressable onPress={() => navigation.navigate('Search')} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
                  <Text style={{ color: '#ffffff', fontSize: 16 }}>Поиск</Text>
                </Pressable>
              )
            })}
          />
          <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Поиск' }} />
          <Stack.Screen name="Chapter" component={ChapterScreen} options={({ route }: any) => ({ title: route.params.item.title })} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeContext.Provider>
  );
}
