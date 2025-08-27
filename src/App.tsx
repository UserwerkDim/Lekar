
import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Pressable, SectionList, FlatList, TextInput, Modal, TouchableOpacity, Appearance, useColorScheme, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import content from '../data/content.json';

type Para = { type: 'text' | 'author' | 'quote_ref'; text: string };
type Item = { title: string; content: Para[] };
type SectionT = { title: string; items: Item[] };

const Stack = createNativeStackNavigator();

const Settings = ({visible, onClose, fontSize, setFontSize, fontFamily, setFontFamily}: any) => {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={{flex:1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent:'flex-end'}}>
        <View style={{backgroundColor:'#111', padding:16, borderTopLeftRadius:16, borderTopRightRadius:16}}>
          <Text style={{color:'#fff', fontSize:18, marginBottom:12}}>Настройки чтения</Text>
          <Text style={{color:'#ccc'}}>Размер шрифта: {fontSize}</Text>
          <View style={{flexDirection:'row', gap:8, marginVertical:8}}>
            {[16,18,20,22,24].map(sz => (
              <Pressable key={sz} onPress={()=>setFontSize(sz)} style={{padding:8, borderRadius:8, backgroundColor: fontSize===sz ? '#444':'#222'}}>
                <Text style={{color:'#fff'}}>{sz}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{color:'#ccc'}}>Шрифт</Text>
          <View style={{flexDirection:'row', gap:8, marginVertical:8}}>
            {['System','Serif','Monospace'].map(ff => (
              <Pressable key={ff} onPress={()=>setFontFamily(ff)} style={{padding:8, borderRadius:8, backgroundColor: fontFamily===ff ? '#444':'#222'}}>
                <Text style={{color:'#fff'}}>{ff}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onClose} style={{marginTop:8, padding:12, backgroundColor:'#333', borderRadius:8, alignSelf:'flex-end'}}>
            <Text style={{color:'#fff'}}>Готово</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

function useBookmarks() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(()=>{
    AsyncStorage.getItem('bookmarks').then(v=>{ if(v) setIds(JSON.parse(v)) });
  },[]);
  useEffect(()=>{
    AsyncStorage.setItem('bookmarks', JSON.stringify(ids));
  },[ids]);
  const toggle = (id:string)=> setIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
  return {ids, toggle};
}

const HomeScreen = ({navigation}: any) => {
  const sections: SectionT[] = (content as any).sections;
  return (
    <SectionList
      sections={sections.map(s => ({title:s.title, data:s.items}))}
      keyExtractor={(item,i)=> item.title + i}
      renderSectionHeader={({section}) => (
        <View style={{backgroundColor:'#111', paddingHorizontal:16, paddingVertical:10}}>
          <Text style={{color:'#fff', fontSize:18}}>{section.title}</Text>
        </View>
      )}
      renderItem={({item, index, section})=> (
        <Pressable onPress={()=>navigation.navigate('Chapter', {sectionTitle: section.title, item})} style={{padding:16, borderBottomWidth:1, borderBottomColor:'#222'}}>
          <Text style={{color:'#eee', fontSize:16}}>{item.title}</Text>
        </Pressable>
      )}
      style={{backgroundColor:'#000'}}
    />
  );
};

const SearchScreen = ({navigation}: any) => {
  const [q, setQ] = useState('');
  const sections: SectionT[] = (content as any).sections;
  const results = useMemo(()=>{
    if (!q.trim()) return [];
    const r: any[] = [];
    sections.forEach((s, si) => s.items.forEach((it, ii)=>{
      const text = it.content.map(p=>p.text).join('\n');
      if (text.toLowerCase().includes(q.toLowerCase()) || it.title.toLowerCase().includes(q.toLowerCase())) {
        r.push({sectionTitle: s.title, item: it});
      }
    }));
    return r;
  }, [q]);
  return (
    <View style={{flex:1, backgroundColor:'#000'}}>
      <TextInput
        placeholder="Поиск по книге"
        placeholderTextColor="#888"
        style={{margin:16, padding:12, borderRadius:8, backgroundColor:'#111', color:'#fff'}}
        value={q}
        onChangeText={setQ}
      />
      <FlatList
        data={results}
        keyExtractor={(it, idx)=>it.item.title+idx}
        renderItem={({item}) => (
          <Pressable onPress={()=>navigation.navigate('Chapter', item)} style={{paddingHorizontal:16, paddingVertical:12, borderBottomColor:'#222', borderBottomWidth:1}}>
            <Text style={{color:'#fff'}}>{item.item.title}</Text>
            <Text numberOfLines={2} style={{color:'#aaa', marginTop:4}}>{item.item.content.map((p:any)=>p.text).join(' ').slice(0,200)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
};

const ChapterScreen = ({route}: any) => {
  const {sectionTitle, item} = route.params;
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState<'System'|'Serif'|'Monospace'>('System');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {ids, toggle} = useBookmarks();
  const id = `${sectionTitle}::${item.title}`;
  const isBookmarked = ids.includes(id);
  const scheme = useColorScheme();

  const fontMap:any = { System: undefined, Serif: 'serif', Monospace: 'monospace' };

  return (
    <View style={{flex:1, backgroundColor: scheme==='dark' ? '#000' : '#fff'}}>
      <ScrollView style={{flex:1}} contentContainerStyle={{padding:16, paddingBottom:48}}>
        <Text style={{color: scheme==='dark' ? '#fff' : '#000', fontSize:22, fontWeight:'600', marginBottom:8}}>{item.title}</Text>
        {item.content.map((p:any, idx:number)=>{
          let color = scheme==='dark' ? '#ddd' : '#222';
          let fontStyle:any = { fontSize, color, lineHeight: fontSize*1.5, marginBottom:12, fontFamily: fontMap[fontFamily] };
          if (p.type === 'author') {
            fontStyle = {...fontStyle, fontStyle: 'italic', borderLeftWidth: 3, borderLeftColor: scheme==='dark' ? '#333':'#ddd', paddingLeft: 10};
          } else if (p.type === 'quote_ref') {
            fontStyle = {...fontStyle, color: scheme==='dark' ? '#aaa' : '#666'};
          }
          return (<Text key={idx} style={fontStyle}>{p.text}</Text>);
        })}
        <View style={{marginTop:16}}>
          <Text style={{fontSize: fontSize-2, color: scheme==='dark' ? '#666' : '#888'}}>
            Сост. Д.Г.Семеник orthopsy.ru
          </Text>
        </View>
      </ScrollView>

      <View style={{position:'absolute', right:16, bottom:16, flexDirection:'row', gap:12}}>
        <TouchableOpacity onPress={()=>toggle(id)} style={{padding:12, backgroundColor:'#222', borderRadius:24}}>
          <Text style={{color:'#fff'}}>{isBookmarked ? '★' : '☆'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>setSettingsOpen(true)} style={{padding:12, backgroundColor:'#222', borderRadius:24}}>
          <Text style={{color:'#fff'}}>Aa</Text>
        </TouchableOpacity>
      </View>

      <Settings
        visible={settingsOpen}
        onClose={()=>setSettingsOpen(false)}
        fontSize={fontSize}
        setFontSize={setFontSize}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
      />
    </View>
  );
};

export default function App(){
  const scheme = useColorScheme();
  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={({navigation})=>({
          title: 'Содержание',
          headerRight: ()=> (
            <Pressable onPress={()=>navigation.navigate('Search')}>
              <Text style={{color: scheme==='dark' ? '#fff' : '#000'}}>Поиск</Text>
            </Pressable>
          )
        })} />
        <Stack.Screen name="Search" component={SearchScreen} options={{title: 'Поиск'}} />
        <Stack.Screen name="Chapter" component={ChapterScreen} options={({route})=>({title: route.params.item.title})} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
