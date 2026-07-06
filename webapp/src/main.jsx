import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, Ban, Camera, Check, ChevronRight, Crown, Gift, Heart,
  Home, MessageCircle, Mic, MoreHorizontal, Play, Send, Star,
  Trash2, User, Video, Volume2, X, Zap
} from 'lucide-react';
import './styles.css';

const A = '/natfile/';
const DATA = {
  allHosts: '/data/allhost.json',
  videoHosts: '/data/shortvideohost.json',
  sayHi: '/data/messagesayhiwords.json',
  callWords: '/data/callingsayhiwords.json'
};

const initialUser = () => ({
  userid: String(Math.floor(Date.now() / 1000)),
  email: 'useremail@hotmail.com',
  password: '123456',
  coins: '0',
  nickname: 'Guest19870613',
  intro: 'Sunshine always comes after the rain',
  age: '18',
  gender: '1',
  avatar: '',
  avatarData: '',
  isNewBie: true,
  isRateUs: false,
  isVIP: false,
  isSVIP: false,
  isMaster: false,
  registTime: new Date().toISOString(),
  getMasterDate: null,
  blockUsers: [],
  myFollowings: [],
  likeHosts: [],
  talkings: [],
  Bills: []
});

const iapList = [
  { product_id: 'com.testiap.purchase', price: '1.99', diamond_count: '150', isNew: '1', freeCount: '0' },
  { product_id: 'com.testiap.purchase', price: '2.99', diamond_count: '150', freeCount: '0' },
  { product_id: 'com.testiap.purchase', price: '4.99', diamond_count: '310', freeCount: '0' },
  { product_id: 'com.testiap.purchase', price: '9.99', diamond_count: '530', freeCount: '50' },
  { product_id: 'com.testiap.purchase', price: '19.99', diamond_count: '1250', isVIP: '1', freeCount: '100', freeWord: '56%User Take' },
  { product_id: 'com.testiap.purchase', price: '29.99', diamond_count: '1750', isMaster: '1', freeCount: '200' },
  { product_id: 'com.testiap.purchase', price: '49.99', diamond_count: '3050', isSVIP: '1', freeCount: '300', freeWord: '22%User Take' },
  { product_id: 'com.testiap.purchase', price: '79.99', diamond_count: '4950', freeCount: '500' },
  { product_id: 'com.testiap.purchase', price: '99.99', diamond_count: '6200', freeCount: '900', freeWord: 'Save Best' }
].map((item, index) => ({
  ...item,
  iapIndex: index,
  eventName: `iap_pur_${index + 1}`,
  htmlEventId: `iap_pur_${index + 1}`
}));

const RATE_US_EVENT_NAME = 'rateus_inappstore';

const giftList = [
  { name: 'Coffee', price: '30', picPath: 'gift_1_picture' },
  { name: 'Car', price: '25', picPath: 'gift_2_picture' },
  { name: 'Diamond', price: '40', picPath: 'gift_3_picture' },
  { name: 'Beauty', price: '80', picPath: 'gift_4_picture' },
  { name: 'LoveU', price: '70', picPath: 'gift_5_picture' },
  { name: 'Bear', price: '120', picPath: 'gift_6_picture' },
  { name: 'Prince', price: '150', picPath: 'gift_7_picture' },
  { name: 'Noble', price: '200', picPath: 'gift_8_picture' }
];

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function nowStamp() {
  return String(Math.floor(Date.now() / 1000));
}

function billTime() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function asset(name) {
  return `${A}${encodeURIComponent(name)}`;
}

function flag(nation) {
  return asset(`nation_${nation}`);
}

function timeLabel(stamp) {
  const d = new Date(Number(stamp) * 1000);
  const age = Date.now() - d.getTime();
  if (age < 24 * 60 * 60 * 1000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function App() {
  const [booted, setBooted] = useState(false);
  const [data, setData] = useState({ allHosts: [], videoHosts: [], sayHi: [], callWords: [] });
  const [user, setUser] = useState(() => loadLS('realUser', null));
  const [tab, setTab] = useState('home');
  const [route, setRoute] = useState([]);
  const [routeLeaving, setRouteLeaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [incoming, setIncoming] = useState(null);
  const [msgDot, setMsgDot] = useState(false);

  useEffect(() => {
    Promise.all(Object.entries(DATA).map(([k, url]) => fetch(url).then(r => r.json()).then(v => [k, v])))
      .then(entries => {
        setData(Object.fromEntries(entries));
        setTimeout(() => setBooted(true), 600);
      });
  }, []);

  useEffect(() => {
    if (user) saveLS('realUser', user);
  }, [user]);

  useEffect(() => {
    window.MokieIAP = {
      items: iapList.map(toIAPPayload),
      getItems: () => iapList.map(toIAPPayload),
      requestPurchase: id => {
        const item = findIAPItem(id);
        if (!item) return false;
        return requestPurchase(item, { forceNative: true });
      },
      completePurchase: (id, success = true) => {
        return success ? completeNativePurchase(id) : failNativePurchase(id);
      },
      failPurchase: id => {
        return failNativePurchase(id);
      }
    };
    iapList.forEach((item, index) => {
      window.MokieIAP[`purchase${index + 1}`] = () => requestPurchase(item, { forceNative: true });
      window.MokieIAP[`complete${index + 1}`] = () => completeNativePurchase(item);
      window.MokieIAP[`fail${index + 1}`] = () => failNativePurchase(item);
      window[`${item.eventName}_success`] = () => completeNativePurchase(item);
      window[`${item.eventName}_fail`] = () => failNativePurchase(item);
    });
    window.iap_pur_success = completeNativePurchase;
    window.iap_pur_fail = failNativePurchase;
    window.MokieRateUs = {
      eventName: RATE_US_EVENT_NAME,
      htmlEventId: RATE_US_EVENT_NAME,
      requestRate: requestRateUs
    };
    return () => {
      delete window.MokieIAP;
      iapList.forEach(item => {
        delete window[`${item.eventName}_success`];
        delete window[`${item.eventName}_fail`];
      });
      delete window.iap_pur_success;
      delete window.iap_pur_fail;
      delete window.MokieRateUs;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !booted || data.allHosts.length === 0) return;
    checkMasterRule();
    const count = Number(localStorage.getItem('newbieMsgCount') || '0');
    if (count >= 7) return;
    const id = setInterval(() => {
      const current = Number(localStorage.getItem('newbieMsgCount') || '0');
      if (current >= 7) {
        clearInterval(id);
        return;
      }
      registerSayHi();
      localStorage.setItem('newbieMsgCount', String(current + 1));
    }, 60000);
    const first = setTimeout(() => {
      if (Number(localStorage.getItem('newbieMsgCount') || '0') < 1) {
        registerSayHi();
        localStorage.setItem('newbieMsgCount', '1');
      }
    }, 2500);
    return () => {
      clearInterval(id);
      clearTimeout(first);
    };
  }, [user?.userid, booted, data.allHosts.length]);

  const hosts = useMemo(() => data.allHosts.filter(h => !(user?.blockUsers || []).includes(h.userid)), [data.allHosts, user?.blockUsers]);
  const allKnownHosts = useMemo(() => [...data.allHosts, ...data.videoHosts], [data]);

  function mutateUser(fn) {
    setUser(prev => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 1800);
  }

  function start() {
    const existing = loadLS('realUser', null);
    const next = existing || initialUser();
    setUser(next);
    saveLS('realUser', next);
    setTimeout(() => setTab('home'), 300);
  }

  function signOut(deleteAccount = false) {
    if (deleteAccount) localStorage.removeItem('realUser');
    setUser(null);
    setRoute([]);
    setTab('home');
  }

  function addCoins(count) {
    mutateUser(u => {
      u.coins = String(Number(u.coins || 0) + Number(count || 0));
    });
  }

  function reduceCoins(count) {
    const value = Number(count || 0);
    if (Number(user.coins || 0) - value >= 0) {
      mutateUser(u => {
        u.coins = String(Number(u.coins || 0) - value);
      });
      return true;
    }
    return false;
  }

  function addBill(title, counts) {
    mutateUser(u => {
      u.Bills = [...(u.Bills || []), { title, counts: String(counts), time: billTime() }];
    });
  }

  function follow(host) {
    mutateUser(u => {
      const set = new Set(u.myFollowings || []);
      set.has(host.userid) ? set.delete(host.userid) : set.add(host.userid);
      u.myFollowings = [...set];
    });
  }

  function like(host) {
    mutateUser(u => {
      const set = new Set(u.likeHosts || []);
      set.has(host.userid) ? set.delete(host.userid) : set.add(host.userid);
      u.likeHosts = [...set];
    });
  }

  function blockHost(host) {
    mutateUser(u => {
      if (!(u.blockUsers || []).includes(host.userid)) u.blockUsers = [...(u.blockUsers || []), host.userid];
      u.talkings = (u.talkings || []).filter(t => t.herid !== host.userid);
    });
    showToast('Success');
  }

  function unblockHost(id) {
    mutateUser(u => {
      u.blockUsers = (u.blockUsers || []).filter(x => x !== id);
    });
  }

  function sendMsgToHost(host, wordType, content, from) {
    const model = {
      userID: host.userid,
      headImage: from === 2 ? user.avatar : host.avatar,
      nickName: host.nickname,
      timestap: nowStamp(),
      wordType,
      content,
      from,
      readStatus: 0
    };
    mutateUser(u => {
      const talkings = [...(u.talkings || [])];
      let message = talkings.find(t => t.herid === host.userid);
      if (!message) {
        message = {
          herid: host.userid,
          nickName: host.nickname,
          headImg: host.avatar,
          timestap: model.timestap,
          lastWord: model.content,
          unreadCount: from === 1 ? 1 : 0,
          chats: []
        };
        talkings.push(message);
      }
      message.chats = [...(message.chats || []), model];
      message.timestap = model.timestap;
      message.lastWord = model.content;
      if (from === 1) message.unreadCount = 1;
      u.talkings = talkings;
    });
  }

  function registerSayHi() {
    if (!data.allHosts.length || !data.sayHi.length) return;
    const available = data.allHosts.filter(h => !(user.blockUsers || []).includes(h.userid));
    const host = sample(available);
    const word = sample(data.sayHi);
    sendMsgToHost(host, 1, word, 1);
    setIncoming({ host, word });
    setMsgDot(true);
    try { new Audio(asset('voice_message.WAV')).play().catch(() => {}); } catch {}
    setTimeout(() => setIncoming(null), 4200);
  }

  function insertFakeCall(chance = 50) {
    if (Math.floor(Math.random() * 100) + 1 >= chance) return;
    const delay = (Math.floor(Math.random() * 3) + 3) * 1000;
    setTimeout(() => {
      const pool = user?.isNewBie ? hosts.slice(0, 70) : hosts;
      const host = sample(pool.length ? pool : hosts);
      if (host) pushRoute({ type: 'call', host, callIn: true });
    }, delay);
  }

  function checkMasterRule() {
    if (!user) return;
    const reg = new Date(user.registTime).getTime();
    const elapsed = Date.now() - reg;
    if (user.getMasterDate && Date.now() - new Date(user.getMasterDate).getTime() > 3 * 86400000) {
      mutateUser(u => { u.isMaster = false; });
    }
    if (user.isMaster) return;
    if ((user.isSVIP && elapsed > 2 * 86400000) || elapsed > 86400000) {
      setModal({ type: 'master', force: true });
    } else if (elapsed > 5 * 60000) {
      setModal({ type: 'master', force: false });
    }
  }

  function openCharge() {
    setModal({ type: 'charge' });
  }

  function purchaseLocal(item) {
    requestPurchase(item);
  }

  function findIAPItem(id) {
    if (typeof id === 'object' && id !== null) {
      return iapList.find(item => item.iapIndex === Number(id.iapIndex)) ||
        iapList.find(item => item.eventName === id.eventName) ||
        iapList.find(item => item.price === String(id.price));
    }
    if (typeof id === 'number') return iapList.find(item => item.iapIndex === id);
    const value = String(id);
    return iapList.find(item => String(item.iapIndex) === value) ||
      iapList.find(item => String(item.iapIndex + 1) === value) ||
      iapList.find(item => item.eventName === value) ||
      iapList.find(item => item.htmlEventId === value) ||
      iapList.find(item => item.price === value) ||
      iapList.find(item => item.product_id === value);
  }

  function toIAPPayload(item) {
    return {
      iapIndex: item.iapIndex,
      eventName: item.eventName,
      htmlEventId: item.htmlEventId,
      productId: item.product_id,
      price: item.price,
      diamondCount: item.diamond_count,
      freeCount: item.freeCount || '0',
      freeWord: item.freeWord || '',
      type: item.isNew === '1' ? 'new' : item.isVIP === '1' ? 'vip' : item.isSVIP === '1' ? 'svip' : item.isMaster === '1' ? 'master' : 'normal'
    };
  }

  function requestPurchase(item, options = {}) {
    const payload = toIAPPayload(item);
    let sentToNative = false;

    window.dispatchEvent(new CustomEvent(item.eventName, { detail: payload }));
    window.dispatchEvent(new CustomEvent('mokie_iap_purchase', { detail: payload }));

    try {
      if (typeof window.MokieIAP?.onPurchaseRequested === 'function') {
        window.MokieIAP.onPurchaseRequested(payload);
        sentToNative = true;
      }
    } catch {}

    try {
      const handler = window.webkit?.messageHandlers?.mokieIAP;
      if (handler?.postMessage) {
        handler.postMessage(payload);
        sentToNative = true;
      }
    } catch {}

    try {
      const indexedHandler = window.webkit?.messageHandlers?.[`mokieIAP${item.iapIndex + 1}`];
      if (indexedHandler?.postMessage) {
        indexedHandler.postMessage(payload);
        sentToNative = true;
      }
    } catch {}

    try {
      const eventHandler = window.webkit?.messageHandlers?.[item.eventName];
      if (eventHandler?.postMessage) {
        eventHandler.postMessage(payload);
        sentToNative = true;
      }
    } catch {}

    if (!sentToNative && !options.forceNative) {
      applyPurchaseSuccess(item);
    }

    return sentToNative;
  }

  function completeNativePurchase(id) {
    const item = findIAPItem(id);
    if (!item) return false;
    applyPurchaseSuccess(item);
    window.dispatchEvent(new CustomEvent(`${item.eventName}_success`, { detail: toIAPPayload(item) }));
    window.dispatchEvent(new CustomEvent('mokie_iap_purchase_success', { detail: toIAPPayload(item) }));
    return true;
  }

  function failNativePurchase(id) {
    const item = findIAPItem(id);
    if (!item) return false;
    showToast('Failed');
    window.dispatchEvent(new CustomEvent(`${item.eventName}_fail`, { detail: toIAPPayload(item) }));
    window.dispatchEvent(new CustomEvent('mokie_iap_purchase_fail', { detail: toIAPPayload(item) }));
    return true;
  }

  function requestRateUs() {
    const payload = {
      eventName: RATE_US_EVENT_NAME,
      htmlEventId: RATE_US_EVENT_NAME
    };
    let sentToNative = false;

    window.dispatchEvent(new CustomEvent(RATE_US_EVENT_NAME, { detail: payload }));

    try {
      if (typeof window.MokieRateUs?.onRateRequested === 'function') {
        window.MokieRateUs.onRateRequested(payload);
        sentToNative = true;
      }
    } catch {}

    try {
      const handler = window.webkit?.messageHandlers?.rateus_inappstore;
      if (handler?.postMessage) {
        handler.postMessage(payload);
        sentToNative = true;
      }
    } catch {}

    try {
      const handler = window.webkit?.messageHandlers?.mokieRateUs;
      if (handler?.postMessage) {
        handler.postMessage(payload);
        sentToNative = true;
      }
    } catch {}

    return sentToNative;
  }

  function applyPurchaseSuccess(item) {
    const amount = Number(item.diamond_count || 0) + Number(item.freeCount || 0);
    mutateUser(u => {
      u.coins = String(Number(u.coins || 0) + amount);
      if (item.isVIP === '1') u.isVIP = true;
      if (item.isSVIP === '1') u.isSVIP = true;
      if (item.isMaster === '1') {
        u.isMaster = true;
        u.getMasterDate = new Date().toISOString();
      }
      if (item.isNew === '1') u.isNewBie = false;
      u.Bills = [...(u.Bills || []), { title: `Purchase ${amount} Diamonds`, counts: amount, time: billTime() }];
    });
    setModal(null);
    showToast('Success');
  }

  function pushRoute(page) {
    setRouteLeaving(false);
    setRoute(r => [...r, page]);
  }

  function popRoute() {
    if (routeLeaving) return;
    setRouteLeaving(true);
    setTimeout(() => {
      setRoute(r => r.slice(0, -1));
      setRouteLeaving(false);
    }, 260);
  }

  if (!booted) return <Splash />;
  if (!user) return <Login onStart={start} openTerms={title => setModal({ type: 'terms', title })} />;

  const current = route[route.length - 1];

  return (
    <div className="app">
      {!current && (
        <>
          <main className="screen">
            {tab === 'home' && <HomePage hosts={hosts} user={user} openDetail={h => setModal({ type: 'detail', host: h })} call={h => pushRoute({ type: 'call', host: h })} openCharge={openCharge} />}
            {tab === 'video' && <VideoFeed hosts={data.videoHosts} user={user} like={like} openDetail={h => setModal({ type: 'detail', host: h })} call={h => pushRoute({ type: 'call', host: h })} chat={h => pushRoute({ type: 'chat', host: h })} showVip={i => setModal({ type: 'vip', index: i })} />}
            {tab === 'rank' && <RankPage hosts={hosts} user={user} follow={follow} openDetail={h => setModal({ type: 'detail', host: h })} />}
            {tab === 'msg' && <MessagesPage user={user} allHosts={allKnownHosts} openChat={h => { setMsgDot(false); pushRoute({ type: 'chat', host: h }); }} />}
            {tab === 'me' && <MePage user={user} allHosts={allKnownHosts} openCharge={openCharge} setModal={setModal} signOut={signOut} unblockHost={unblockHost} setAvatar={avatarData => mutateUser(u => { u.avatarData = avatarData; })} />}
          </main>
          <Tabbar tab={tab} setTab={setTab} msgDot={msgDot || (user.talkings || []).some(t => t.unreadCount)} />
        </>
      )}

      {current?.type === 'chat' && <ChatPage leaving={routeLeaving} host={current.host} user={user} sendMsgToHost={sendMsgToHost} openDetail={h => setModal({ type: 'detail', host: h })} openGift={h => setModal({ type: 'gift', host: h })} call={h => pushRoute({ type: 'call', host: h })} back={popRoute} showVip={() => setModal({ type: 'vip', index: 1 })} reduceCoins={reduceCoins} addBill={addBill} insertFakeCall={insertFakeCall} setModal={setModal} />}
      {current?.type === 'call' && <CallPage leaving={routeLeaving} host={current.host} user={user} callIn={current.callIn} back={popRoute} openGift={h => setModal({ type: 'gift', host: h })} openCharge={openCharge} reduceCoins={reduceCoins} addBill={addBill} blockHost={blockHost} showToast={showToast} setModal={setModal} />}
      {modal && <ModalHub modal={modal} setModal={setModal} user={user} hosts={hosts} allHosts={allKnownHosts} purchaseLocal={purchaseLocal} requestRateUs={requestRateUs} openCharge={openCharge} addCoins={addCoins} reduceCoins={reduceCoins} addBill={addBill} follow={follow} blockHost={blockHost} sendMsgToHost={sendMsgToHost} pushRoute={pushRoute} mutateUser={mutateUser} showToast={showToast} />}
      <NativeIAPEvents purchaseLocal={purchaseLocal} requestRateUs={requestRateUs} />
      {incoming && <IncomingToast item={incoming} open={() => { setIncoming(null); pushRoute({ type: 'chat', host: incoming.host }); }} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function NativeIAPEvents({ purchaseLocal, requestRateUs }) {
  return (
    <div id="mokie-native-iap-events" hidden aria-hidden="true">
      {iapList.map(item => (
        <button
          key={item.htmlEventId}
          id={item.htmlEventId}
          data-iap-index={item.iapIndex}
          data-iap-event={item.eventName}
          data-product-id={item.product_id}
          data-price={item.price}
          data-diamond-count={item.diamond_count}
          onClick={() => purchaseLocal(item)}
        />
      ))}
      <button
        id={RATE_US_EVENT_NAME}
        data-rate-event={RATE_US_EVENT_NAME}
        onClick={requestRateUs}
      />
    </div>
  );
}

function Splash() {
  return <div className="splash" style={{ backgroundImage: `url("${asset('icon_launch_pic')}"), url("${asset('icon_loading_backimg')}")` }} />;
}

function Login({ onStart, openTerms }) {
  return (
    <div className="login" style={{ backgroundImage: `url("${asset('icon_loading_backimg')}")` }}>
      <div className="login-bottom">
        <div className="tagline">Live ,Video ,Chat</div>
        <button className="primary wide" onClick={onStart}>I'M NEW</button>
        <button className="ghost wide" onClick={onStart}>SIGN IN</button>
        <div className="agreement">
          <div>By tap start means you agree with our</div>
          <button onClick={() => openTerms('Terms of use')}>Terms of use</button>
          <button onClick={() => openTerms('Privacy Policy')}>Privacy Policy</button>
        </div>
      </div>
    </div>
  );
}

function Tabbar({ tab, setTab, msgDot }) {
  const items = [
    ['home', Home, 'icon_home'],
    ['video', Play, 'icon_video'],
    ['rank', Star, 'icon_rank'],
    ['msg', MessageCircle, 'icon_message'],
    ['me', User, 'icon_me']
  ];
  return (
    <nav className="tabbar">
      {items.map(([id, Icon, img]) => (
        <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
          <img src={asset(`${img}_${tab === id ? 'selected' : 'normal'}`)} onError={e => { e.currentTarget.style.display = 'none'; }} />
          <Icon size={23} />
          {id === 'msg' && msgDot && <span className="dot" />}
        </button>
      ))}
    </nav>
  );
}

function HomePage({ hosts, user, openDetail, call, openCharge }) {
  const [cat, setCat] = useState('ALL');
  const [limit, setLimit] = useState(20);
  const filtered = useMemo(() => {
    let arr = [...hosts];
    if (cat === 'ALL') arr = shuffle(arr);
    if (cat === 'New') arr = arr.sort((a, b) => Number(a.joinDays) - Number(b.joinDays)).slice(0, 30);
    if (cat === 'Sexy') arr = arr.sort((a, b) => Number(a.age) - Number(b.age)).slice(0, 30);
    if (cat === 'Hot') arr = arr.sort((a, b) => Number(a.height) - Number(b.height)).slice(0, 55);
    return arr;
  }, [hosts, cat]);
  return (
    <div className="page">
      <div className="home-tabs">
        {['ALL', 'New', 'Sexy', 'Hot'].map(t => <button className={cat === t ? 'active' : ''} onClick={() => { setCat(t); setLimit(20); }} key={t}>{t}</button>)}
      </div>
      {user.isNewBie && <button className="gift-float" onClick={() => openCharge()}><img src={asset('icon_new_giftbox')} /></button>}
      <div className="masonry">
        {filtered.slice(0, limit).map(h => <HostCard key={h.userid} host={h} open={() => openDetail(h)} call={() => call(h)} />)}
      </div>
      {limit < filtered.length && <button className="load-more" onClick={() => setLimit(limit + 20)}>Load more</button>}
    </div>
  );
}

function HostCard({ host, open, call }) {
  return (
    <article className="host-card" onClick={open}>
      <img className="host-img" src={host.avatar} />
      <div className="card-shade">
        <span className="online" />
        <div className="nation"><img src={flag(host.nation)} />{host.nation}</div>
        <b>{host.nickname}</b>
        <button onClick={e => { e.stopPropagation(); call(); }}><Video size={22} /></button>
      </div>
    </article>
  );
}

function VideoFeed({ hosts, user, like, openDetail, call, chat, showVip }) {
  const refs = useRef({});
  function onScroll(e) {
    const h = e.currentTarget.clientHeight;
    const idx = Math.round(e.currentTarget.scrollTop / h);
    Object.entries(refs.current).forEach(([i, video]) => {
      if (!video) return;
      Number(i) === idx ? video.play().catch(() => {}) : video.pause();
    });
    if (idx > 5 && !(user.isVIP || user.isSVIP || user.isMaster)) {
      showVip(0);
      e.currentTarget.scrollTo({ top: 5 * h, behavior: 'smooth' });
    }
  }
  return (
    <div className="video-feed" onScroll={onScroll}>
      {hosts.map((h, i) => (
        <section className="video-item" key={h.userid}>
          <video ref={el => refs.current[i] = el} src={h.shortVideo_url} poster={h.avatar} playsInline muted loop controls={false} />
          <div className="video-gradient" />
          <div className="video-side">
            <button onClick={() => openDetail(h)}><img src={h.avatar} /></button>
            <button onClick={() => call(h)}><Video /></button>
            <button className={(user.likeHosts || []).includes(h.userid) ? 'liked' : ''} onClick={() => like(h)}><Heart fill="currentColor" /></button>
            <button onClick={() => chat(h)}><MessageCircle /></button>
          </div>
          <div className="video-caption">
            <b>{h.nickname}</b>
            <span>{h.shortVideo_desc || h.intro}</span>
          </div>
        </section>
      ))}
    </div>
  );
}

function RankPage({ hosts, user, follow, openDetail }) {
  const [mode, setMode] = useState('Daily');
  const sorted = [...hosts].sort((a, b) => Number(b.fireCount) - Number(a.fireCount));
  const list = mode === 'Daily' ? sorted.slice(80, 100) : sorted.slice(0, 20);
  const top = list.slice(0, 3);
  const rest = list.slice(3);
  return (
    <div className="page rank-page">
      <h1>Girls Popular</h1>
      <div className="seg"><button className={mode === 'Daily' ? 'active' : ''} onClick={() => setMode('Daily')}>Daily</button><button className={mode === 'Weekly' ? 'active' : ''} onClick={() => setMode('Weekly')}>Weekly</button></div>
      <div className="podium">
        {top.map((h, i) => <div className={`podium-item p${i}`} key={h.userid} onClick={() => openDetail(h)}><img src={h.avatar} /><button onClick={e => { e.stopPropagation(); follow(h); }}><Check size={13} /></button><b>{h.nickname}</b><span><Zap size={12} />{h.fireCount}</span></div>)}
      </div>
      <div className="rank-list">
        {rest.map((h, i) => <RankRow key={h.userid} host={h} n={i + 4} user={user} follow={follow} openDetail={openDetail} />)}
      </div>
    </div>
  );
}

function RankRow({ host, n, user, follow, openDetail }) {
  return (
    <div className="rank-row" onClick={() => openDetail(host)}>
      <b className="rank-num">{n}</b>
      <img src={host.avatar} />
      <div><b>{host.nickname}, {host.age}</b><span><img src={flag(host.nation)} />{host.nation} <Zap size={12} />{host.fireCount}</span></div>
      <button className={(user.myFollowings || []).includes(host.userid) ? 'active' : ''} onClick={e => { e.stopPropagation(); follow(host); }}>{(user.myFollowings || []).includes(host.userid) ? 'Followed' : 'Follow'}</button>
    </div>
  );
}

function MessagesPage({ user, allHosts, openChat }) {
  const talks = [...(user.talkings || [])].sort((a, b) => Number(b.timestap) - Number(a.timestap));
  const official = { userid: 'official', nickname: 'Official', avatar: asset('icon_message_officialavatar') };
  return (
    <div className="page">
      <HeaderTitle title="Message" />
      <div className="official" onClick={() => openChat(official)}>
        <img src={official.avatar} /><div><b>Official</b><p>Hey,Baby Welcome to our global family...</p></div><ChevronRight />
      </div>
      {talks.length === 0 && <Empty />}
      {talks.map(t => {
        const h = allHosts.find(x => x.userid === t.herid) || { userid: t.herid, nickname: t.nickName, avatar: t.headImg };
        return <div className="message-row" key={t.herid} onClick={() => openChat(h)}><img src={t.headImg} /><div><b>{t.nickName}</b><p>{t.lastWord}</p></div><span>{timeLabel(t.timestap)}</span>{t.unreadCount ? <i /> : null}</div>;
      })}
    </div>
  );
}

function ChatPage({ leaving, host, user, sendMsgToHost, openDetail, openGift, call, back, showVip, reduceCoins, addBill, insertFakeCall, setModal }) {
  const talks = user.talkings || [];
  const thread = talks.find(t => t.herid === host.userid);
  const chats = thread?.chats || [];
  const [text, setText] = useState('');
  useEffect(() => {
    const read = new Set(loadLS('readUseridList', []));
    read.add(host.userid);
    saveLS('readUseridList', [...read]);
  }, [host.userid]);
  function send() {
    const content = text.trim();
    if (!content) return;
    const free = Number(localStorage.getItem('freemsgCount') || '0');
    if (free < 3) {
      sendMsgToHost(host, 1, content, 2);
      reduceCoins('1');
      addBill(`Send Message to ${host.nickname}`, '1');
      localStorage.setItem('freemsgCount', String(free + 1));
    } else if (user.isVIP || user.isSVIP || user.isMaster) {
      sendMsgToHost(host, 1, content, 2);
      addBill(`Send Message to ${host.nickname}`, '0');
    } else {
      setModal({ type: 'notVipMessage', showVip });
      return;
    }
    setText('');
    insertFakeCall(50);
  }
  return (
    <div className={`subscreen push-screen ${leaving ? 'pop-screen' : ''}`}>
      <Nav title={host.nickname} back={back} right={<button onClick={() => setModal({ type: 'report', host })}><MoreHorizontal /></button>} />
      <div className="chat-list">
        {chats.map((c, i) => <div className={`bubble-row ${c.from === 2 ? 'me' : ''}`} key={i}><img src={c.from === 2 ? (user.avatarData || asset('icon_myself_avatar_default')) : c.headImage} onClick={() => openDetail(host)} /><div className="bubble">{c.content}</div></div>)}
      </div>
      <div className="chat-input">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message" />
        <button onClick={() => openGift(host)}><Gift /></button>
        <button onClick={() => call(host)}><Video /></button>
        <button onClick={send}><Send /></button>
      </div>
    </div>
  );
}

function CallPage({ leaving, host, user, callIn, back, openGift, openCharge, reduceCoins, addBill, blockHost, showToast, setModal }) {
  const [phase, setPhase] = useState(callIn ? 'incoming' : 'connecting');
  const [seconds, setSeconds] = useState(0);
  const [words, setWords] = useState([]);
  const [draft, setDraft] = useState('');
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const localVideo = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let audio;
    try {
      audio = new Audio(asset(callIn ? 'voice_callin.WAV' : 'voice_callout.WAV'));
      audio.loop = true;
      audio.play().catch(() => {});
    } catch {}
    if (!callIn) {
      const t = setTimeout(() => setPhase('call'), 1000);
      return () => { clearTimeout(t); audio?.pause(); cleanup(); };
    }
    return () => { audio?.pause(); cleanup(); };
  }, []);

  useEffect(() => {
    if (phase !== 'call') return;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false }).then(stream => {
      streamRef.current = stream;
      if (localVideo.current) localVideo.current.srcObject = stream;
    }).catch(() => {});
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'call' || seconds < 1) return;
    if (user.isNewBie && Number(localStorage.getItem('newbieTryFreeCall') || '0') < 1) {
      if (seconds >= 15) {
        localStorage.setItem('newbieTryFreeCall', '1');
        showToast('Try Call End');
        back();
      }
      return;
    }
    if (seconds % 60 === 1) {
      const price = Number(host.price || 0);
      const cost = user.isMaster ? 0 : user.isSVIP ? Math.ceil(price / 2) : price;
      if (Number(user.coins || 0) >= cost) {
        reduceCoins(String(cost));
        blockHost(host);
      } else {
        showToast('Lack of Diamonds');
        setTimeout(back, 1000);
      }
    }
  }, [seconds]);

  function cleanup() {
    streamRef.current?.getTracks().forEach(t => t.stop());
  }
  function hangup() {
    const min = Math.ceil(seconds / 60);
    const price = Number(host.price || 0);
    const cost = user.isMaster ? 0 : user.isSVIP ? Math.floor(min * price / 2) : min * price;
    addBill(`Video Call With ${host.nickname}`, String(cost));
    setModal({ type: 'rateHost', host });
    back();
  }
  function accept() {
    setPhase('call');
  }
  const formatted = new Date(seconds * 1000).toISOString().slice(11, 19);
  if (phase !== 'call') {
    return (
      <div className="call-wait" style={{ backgroundImage: `url("${host.avatar}")` }}>
        <div className="blur" />
        <img className="calling-avatar" src={host.avatar} />
        <h2>{host.nickname} ,{host.age} Years</h2>
        <p><img src={flag(host.nation)} />{host.nation}</p>
        <p><img src={asset('icon_diamond')} />{host.price}/min</p>
        <div className="call-actions">
          <button className="decline" onClick={back}><X /></button>
          {callIn && <button className="accept" onClick={accept}><Video /></button>}
        </div>
        <span>{callIn ? '' : 'Connecting...'}</span>
      </div>
    );
  }
  return (
    <div className={`call-screen push-screen ${leaving ? 'pop-screen' : ''}`}>
      {host.video_url ? <video className="remote-video" src={host.video_url} poster={host.avatar} autoPlay playsInline /> : <div className="remote-video video-empty"><img src={host.avatar} /><span>Connecting...</span></div>}
      <div className="local-camera"><video ref={localVideo} autoPlay muted playsInline className={!cam ? 'hidden' : ''} />{!cam && <Camera />}</div>
      <button className="coin-pill" onClick={openCharge}><img src={asset('icon_diamond')} />{user.coins}</button>
      <div className="call-chat">
        <p><img src={asset('icon_callling_tips')} />In private chat,please respect the host. Don't expose your body,Also don't use vulgar word</p>
        {words.map((w, i) => <span key={i}>{w}</span>)}
      </div>
      <div className="call-input">
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Message" />
        <button onClick={() => { if (draft.trim()) { setWords([...words, draft.trim()]); setDraft(''); } }}><Send /></button>
        <button onClick={() => openGift(host)}><Gift /></button>
      </div>
      <div className="call-bar">
        <div><b>{host.nickname}</b><span>{formatted}</span></div>
        <button onClick={() => setCam(!cam)} className={!cam ? 'off' : ''}><Camera /></button>
        <button onClick={() => setMic(!mic)} className={!mic ? 'off' : ''}><Mic /></button>
        <button className="decline" onClick={hangup}><X /></button>
      </div>
    </div>
  );
}

function MePage({ user, allHosts, openCharge, setModal, signOut, unblockHost, setAvatar }) {
  const fileRef = useRef(null);
  const following = (user.myFollowings || []).map(id => allHosts.find(h => h.userid === id)).filter(Boolean);
  const blocks = (user.blockUsers || []).map(id => allHosts.find(h => h.userid === id) || { userid: id, nickname: id, avatar: asset('icon_myself_avatar_default') });
  function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  }
  return (
    <div className="page me-page">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={upload} />
      <button className="avatar-btn" onClick={() => fileRef.current?.click()}>
        {(user.isVIP || user.isSVIP) && <img className="crown" src={asset(user.isSVIP ? 'icon_svip_huangguan' : 'icon_vip_huangguan')} />}
        <img src={user.avatarData || asset('icon_myself_avatar_default')} />
      </button>
      <h2>{user.nickname}</h2>
      <button className="edit-dot"> <img src={asset('icon_me_editinfo')} /> </button>
      <p>id:{user.userid}</p>
      <div className="stats"><button onClick={() => setModal({ type: 'list', title: 'Friends', items: [] })}><b>0</b><span>Friends</span></button><button onClick={() => setModal({ type: 'list', title: 'Following', items: following })}><b>{following.length}</b><span>Following</span></button><button><b>0</b><span>Follower</span></button></div>
      <div className="vip-cards"><button onClick={() => setModal({ type: 'vip', index: 0 })}><img src={asset('icon_me_vippic')} /></button><button onClick={() => setModal({ type: 'vip', index: 1 })}><img src={asset('icon_me_svippic')} /></button></div>
      <button className="balance" onClick={openCharge}><img src={asset('icon_diamond')} /><b>{user.coins}</b>{!user.isRateUs && <span onClick={e => { e.stopPropagation(); setModal({ type: 'rateApp' }); }}><img src={asset('icon_100_free')} /></span>}<em>Get More</em><ChevronRight /></button>
      <div className="settings">
        <Setting icon="icon_me_support" title="Online Support" onClick={() => setModal({ type: 'support' })} />
        <Setting icon="icon_me_bill" title="Bill" onClick={() => setModal({ type: 'bills' })} />
        <Setting icon="icon_me_blockList" title="BlockList" onClick={() => setModal({ type: 'blocks', items: blocks, unblockHost })} />
        <Setting icon="icon_me_terms" title="Terms of user" onClick={() => setModal({ type: 'terms', title: 'Terms of use' })} />
        <Setting icon="icon_me_privacy" title="Privacy Policy" onClick={() => setModal({ type: 'terms', title: 'Privacy Policy' })} />
        <Setting icon="icon_me_clearcashe" title="Clear Cashe" onClick={() => setModal({ type: 'confirm', title: 'Clear Cashe', text: 'Do you want to clear cashe?', ok: () => {} })} />
        <Setting icon="icon_me_deleteaccount" title="Delete Account" onClick={() => setModal({ type: 'confirm', title: 'Delete Account', text: 'Delete account will delete all your data in app,are you sure to do this?', ok: () => signOut(true), okText: 'Delete' })} />
      </div>
      <button className="signout" onClick={() => setModal({ type: 'confirm', title: 'Sign out', text: 'Sign out will not receive her message,do you really want to?', ok: () => signOut(false) })}>Sign out</button>
    </div>
  );
}

function Setting({ icon, title, onClick }) {
  return <button className="setting" onClick={onClick}><img src={asset(icon)} /><span>{title}</span><ChevronRight /></button>;
}

function ModalHub(props) {
  const { modal, setModal } = props;
  if (modal.type === 'detail') return <HostDetail {...props} host={modal.host} />;
  if (modal.type === 'gift') return <GiftSheet {...props} host={modal.host} />;
  if (modal.type === 'charge') return <ChargeSheet {...props} />;
  if (modal.type === 'vip') return <VipSheet {...props} index={modal.index || 0} />;
  if (modal.type === 'master') return <MasterSheet {...props} force={modal.force} />;
  if (modal.type === 'rateApp') return <RateApp {...props} />;
  if (modal.type === 'rateHost') return <RateHost {...props} host={modal.host} />;
  if (modal.type === 'report') return <ReportSheet {...props} host={modal.host} />;
  if (modal.type === 'notVipMessage') return <InfoPop image="icon_notvip_sendmsgtips" click={() => { setModal(null); modal.showVip(); }} close={() => setModal(null)} />;
  if (modal.type === 'terms') return <TextModal title={modal.title} close={() => setModal(null)} />;
  if (modal.type === 'support') return <Support close={() => setModal(null)} />;
  if (modal.type === 'bills') return <ListModal title="Bill" items={props.user.Bills || []} close={() => setModal(null)} render={b => <><b>{b.title}</b><span>{b.time}</span><em>-{b.counts}</em></>} />;
  if (modal.type === 'blocks') return <ListModal title="Block list" items={modal.items} close={() => setModal(null)} render={h => <><img src={h.avatar} /><b>{h.nickname}</b><button onClick={() => modal.unblockHost(h.userid)}>Unblock</button></>} />;
  if (modal.type === 'list') return <ListModal title={modal.title} items={modal.items} close={() => setModal(null)} render={h => <><img src={h.avatar} /><b>{h.nickname}</b></>} />;
  if (modal.type === 'confirm') return <Confirm {...modal} close={() => setModal(null)} />;
  return null;
}

function HostDetail({ host, setModal, user, follow, blockHost, pushRoute }) {
  const photos = [host.avatar, ...(host.photos || [])];
  return (
    <div className="overlay">
      <div className="detail-card">
        <button className="close" onClick={() => setModal(null)}><X /></button>
        <div className="photo-strip">{photos.map((p, i) => <img key={i} src={p} />)}</div>
        <section>
          <div className="detail-head"><span><img src={flag(host.nation)} />{host.nickname}</span><b><img src={asset('icon_diamond')} />{host.price}/min</b></div>
          <div className="info-card"><span className="green">Online</span><span className="green">Active {host.activeTime} min ago</span><button onClick={() => { setModal(null); pushRoute({ type: 'chat', host }); }}><MessageCircle /></button><p><em>{host.nation}</em><em>{host.age} years</em><em>{host.height} cm</em><em>Joined us {host.joinDays} days</em></p></div>
          <div className="info-card"><b>Profile Verification</b><p><em>Facebook</em><em>Twitter</em><em>Phone</em><em>Photo</em></p></div>
          <div className="info-card"><b>Self introduction</b><p>{host.intro}</p></div>
        </section>
        <div className="detail-actions">
          <button onClick={() => follow(host)} className={(user.myFollowings || []).includes(host.userid) ? 'active' : ''}><Heart />Follow</button>
          <button className="primary" onClick={() => { setModal(null); pushRoute({ type: 'call', host }); }}><Video />Call</button>
          <button onClick={() => setModal({ type: 'report', host })}><Ban />Report</button>
        </div>
      </div>
    </div>
  );
}

function GiftSheet({ host, user, setModal, reduceCoins, addBill, showToast }) {
  const [current, setCurrent] = useState(0);
  function send() {
    const gift = giftList[current];
    if (Number(gift.price) <= Number(user.coins || 0)) {
      reduceCoins(gift.price);
      addBill(`Send a ${gift.name} to ${host.nickname}`, gift.price);
      setModal(null);
      showToast('Success');
    } else {
      showToast('Lack of Diamonds');
      setModal({ type: 'charge' });
    }
  }
  return <Sheet close={() => setModal(null)}><div className="gift-head"><span><img src={asset('icon_diamond')} />{user.coins}</span><button onClick={send}>Send</button></div><div className="gift-grid">{giftList.map((g, i) => <button key={g.name} className={current === i ? 'active' : ''} onClick={() => setCurrent(i)}><img src={asset(g.picPath)} /><b>{g.name}</b><span><img src={asset('icon_diamond')} />{g.price}</span></button>)}</div></Sheet>;
}

function ChargeSheet({ user, setModal, purchaseLocal }) {
  return (
    <Sheet close={() => setModal(null)} tall>
      <h3 className="charge-title">Account Balance:</h3>
      <div className="big-balance"><img src={asset('icon_diamond')} />{user.coins}</div>
      {iapList.filter(x => x.isNew !== '1').map((item, i) => (
        <button className="charge-row" key={i} onClick={() => purchaseLocal(item)}>
          <span className="charge-pack">
            <span className="charge-main">
              <img src={asset('icon_diamond')} />
              <b>{item.diamond_count}</b>
              {Number(item.freeCount) > 0 && <em>+{item.freeCount}</em>}
            </span>
            {item.freeWord && <small><Zap size={12} />{item.freeWord}</small>}
          </span>
          <strong>${item.price}</strong>
        </button>
      ))}
    </Sheet>
  );
}

function VipSheet({ setModal, purchaseLocal, index }) {
  const [mode, setMode] = useState(index);
  const item = iapList.find(x => mode === 0 ? x.isVIP === '1' : x.isSVIP === '1');
  const descs = ['Unlock Short Videos Feature', 'Message Chat For Free', 'View Photos Unlimited', 'Get the Host answer in call video', 'Get Diamonds Right Now', 'Each Video Call Fee cut off 50%', 'Exchange contacts with girls', 'Free to join local WhatsApp group'];
  return (
    <div className="overlay vip-overlay">
      <div className={`vip-pop oc-vip ${mode ? 'svip' : ''}`}>
        <img className="vip-bg" src={asset('icon_vip_girl')} />
        <img className="vip-crown" src={asset(mode ? 'icon_svip_huangguan' : 'icon_vip_huangguan')} />
        <div className="vip-segment">
          <button className={!mode ? 'active' : ''} onClick={() => setMode(0)}>VIP</button>
          <button className={mode ? 'active' : ''} onClick={() => setMode(1)}>SVIP</button>
        </div>
        <h2>{mode ? 'Become SVIP and enjoy' : 'Become VIP and enjoy'}<br />{mode ? 'All Features' : 'Following Features'}</h2>
        <div className="vip-feature-list">
          {descs.map((d, i) => {
            const enabled = mode || i < 4;
            return <p key={d}><img src={asset(enabled ? 'icon_vip_haveright' : 'icon_vip_Cancel')} />{i + 1}.{d}</p>;
          })}
        </div>
        <button className="vip-buy" onClick={() => purchaseLocal(item)}>
          <span className={mode ? 'strike' : ''}>{mode ? '$99.99' : '$19.99'}</span>
          {mode && <span>$49.99</span>}
          <b>{mode ? 'GET SVIP' : 'GET VIP'}</b>
        </button>
      </div>
      <button className="vip-close-out" onClick={() => setModal(null)}><img src={asset('icon_vip_Cancel')} /></button>
    </div>
  );
}

function MasterSheet({ setModal, purchaseLocal, force }) {
  const item = iapList.find(x => x.isMaster === '1');
  return <div className="overlay"><div className="master-pop">{!force && <button className="close" onClick={() => setModal(null)}><X /></button>}<img src={asset('icon_master_purchase')} /><button className="gold" onClick={() => purchaseLocal(item)}>${item.price}</button></div></div>;
}

function RateApp({ setModal, mutateUser, addCoins, requestRateUs }) {
  function done() {
    requestRateUs();
    mutateUser(u => { u.isRateUs = true; });
    addCoins(100);
    setModal(null);
  }
  return <div className="overlay"><div className="rate-pop"><button className="close" onClick={() => setModal(null)}><X /></button><img src={asset('static_rateus')} /><button className="primary" onClick={done}>Rate Now</button></div></div>;
}

function RateHost({ host, setModal }) {
  return <div className="overlay"><div className="rate-host"><img src={host.avatar} /><h3>{host.nickname}</h3><div>{[1,2,3,4,5].map(i => <Star key={i} fill="#f0c859" color="#f0c859" />)}</div><button className="primary" onClick={() => setModal(null)}>Submit</button></div></div>;
}

function ReportSheet({ host, setModal, blockHost }) {
  return <Sheet close={() => setModal(null)}><button className="sheet-row" onClick={() => { blockHost(host); setModal(null); }}>Block</button><button className="sheet-row" onClick={() => setModal({ type: 'confirm', title: 'Report', text: 'Thanks for your report.', ok: () => {} })}>Report</button><button className="sheet-row" onClick={() => setModal(null)}>Cancel</button></Sheet>;
}

function InfoPop({ image, click, close }) {
  return <div className="overlay" onClick={close}><img className="info-image" src={asset(image)} onClick={e => { e.stopPropagation(); click(); }} /></div>;
}

function TextModal({ title, close }) {
  const text = title.includes('Privacy') ? 'We respect your privacy. This H5 build stores account, chat, block, bill and membership data locally in this browser.' : 'By using this service you agree to follow the community rules, respect other users, and use the app responsibly.';
  return <AnimatedSubModal title={title} close={close}><div className="terms"><p>{text}</p><p>APP and its services are provided as a local demo in this H5 conversion. No Firebase or payment backend is connected in this build.</p></div></AnimatedSubModal>;
}

function Support({ close }) {
  return <AnimatedSubModal title="Online Support" close={close}><div className="support"><div className="official"><img src={asset('icon_message_officialavatar')} /><div><b>Official</b><p>We will answer your enquiry in 48 hours on business days.</p></div></div></div></AnimatedSubModal>;
}

function Confirm({ title, text, ok, okText = 'Sure', close }) {
  return <div className="overlay"><div className="confirm"><h3>{title}</h3><p>{text}</p><div><button onClick={close}>Cancel</button><button onClick={() => { ok?.(); close(); }}>{okText}</button></div></div></div>;
}

function ListModal({ title, items, render, close }) {
  return <AnimatedSubModal title={title} close={close}><div className="list-modal">{items.length === 0 ? <Empty /> : items.map((item, i) => <div className="list-item" key={item.userid || i}>{render(item)}</div>)}</div></AnimatedSubModal>;
}

function Sheet({ children, close, tall }) {
  return <div className="overlay sheet-overlay" onClick={close}><div className={`sheet ${tall ? 'tall' : ''}`} onClick={e => e.stopPropagation()}>{children}</div></div>;
}

function AnimatedSubModal({ title, close, children }) {
  const [leaving, setLeaving] = useState(false);
  function back() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(close, 260);
  }
  return <div className={`submodal push-screen ${leaving ? 'pop-screen' : ''}`}><Nav title={title} back={back} />{children}</div>;
}

function HeaderTitle({ title }) {
  return <h1 className="page-title">{title}</h1>;
}

function Nav({ title, back, right }) {
  return <header className="nav"><button onClick={back}><ArrowLeft /></button><h2>{title}</h2>{right || <span />}</header>;
}

function Empty() {
  return <div className="empty"><img src={asset('icon_notinghere')} /><span>No data</span></div>;
}

function IncomingToast({ item, open }) {
  return <button className="incoming" onClick={open}><img src={item.host.avatar} /><span><b>{item.host.nickname}</b><em>{item.word}</em></span><ChevronRight /></button>;
}

createRoot(document.getElementById('root')).render(<App />);
