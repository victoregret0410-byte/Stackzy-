/**

- STACK MASTER — Native Bridge v3 (Capacitor 6)
- En web : tout est simulé. En natif : vrais SDK Apple/Google.
  */
  const isNative = typeof window.Capacitor !== ‘undefined’;
  const platform = isNative ? (window.Capacitor.getPlatform?.() || ‘web’) : ‘web’;

const IAP = {
noads:   ‘com.stackzy.app.noads’,
prem:    ‘com.stackzy.app.premium’,
starter: ‘com.stackzy.app.starter’,
g500:    ‘com.stackzy.app.gems500’,
g1500:   ‘com.stackzy.app.gems1500’,
g5000:   ‘com.stackzy.app.gems5000’,
};
let iapReady = false;

async function initIAP() {
if (!isNative) return;
try {
const { InAppPurchases } = await import(’@capacitor/in-app-purchases’);
await InAppPurchases.register({ productIdentifiers: Object.values(IAP) });
InAppPurchases.addListener(‘onProductsLoaded’, () => { iapReady = true; });
InAppPurchases.addListener(‘onTransactionComplete’, (tx) => grantP(tx.productIdentifier));
InAppPurchases.addListener(‘onTransactionFailed’, () => toast(‘Achat annulé’, ‘er’));
await InAppPurchases.getProducts();
await InAppPurchases.restorePurchases();
} catch (e) { console.warn(’[IAP]’, e); }
}

function grantP(pid) {
const k = Object.keys(IAP).find(k => IAP[k] === pid);
if (!k) return;
switch (k) {
case ‘noads’: S.noAds = true; toast(‘✓ Plus de pubs !’, ‘ok’); break;
case ‘prem’: S.hasPrem = true; S.gems += 200; if (!S.skins.includes(‘royal’)) { S.skins.push(‘royal’); S.skin = ‘royal’; } toast(‘⭐ Premium !’, ‘ok’); break;
case ‘starter’: S.gems += 1000; S.coins += 500; if (!S.skins.includes(‘candy’)) { S.skins.push(‘candy’); S.skin = ‘candy’; } toast(‘🎁 Pack !’, ‘ok’); break;
case ‘g500’: S.gems += 500; toast(’+500 💎’, ‘ok’); break;
case ‘g1500’: S.gems += 1500; toast(’+1500 💎’, ‘ok’); break;
case ‘g5000’: S.gems += 5000; toast(’+5000 💎’, ‘ok’); break;
}
save(); uM(); sfx(‘buy’);
}

// Override buyIAP en natif
const _simBuy = window.buyIAP;
window.buyIAP = async function(id) {
if (!isNative) { _simBuy(id); return; }
if (!iapReady) { toast(‘Chargement…’, ‘er’); return; }
try { const { InAppPurchases } = await import(’@capacitor/in-app-purchases’); await InAppPurchases.purchase({ productIdentifier: IAP[id] || IAP[id.replace(‘prem’,‘premium’)] }); } catch (e) { toast(‘Erreur’, ‘er’); }
};

// AdMob
const ADS = { banner: ‘ca-app-pub-3940256099942544/2934735716’, interstitial: ‘ca-app-pub-3940256099942544/4411468910’, rewarded: ‘ca-app-pub-3940256099942544/1712485313’ };
let adIntOk = false, adRewOk = false, adRewCb = null;

async function initAds() {
if (!isNative || S.noAds) return;
try {
const { AdMob } = await import(’@capacitor-community/admob’);
await AdMob.initialize({ initializeForTesting: true });
AdMob.addListener(‘onInterstitialAdLoaded’, () => { adIntOk = true; });
AdMob.addListener(‘onInterstitialAdDismissed’, () => { adIntOk = false; ldI(); });
AdMob.addListener(‘onRewardedVideoAdLoaded’, () => { adRewOk = true; });
AdMob.addListener(‘onRewardedVideoAdDismissed’, () => { adRewOk = false; ldR(); });
AdMob.addListener(‘onRewardedVideoAdReward’, () => { if (adRewCb) { adRewCb(); adRewCb = null; } });
ldI(); ldR();
} catch (e) {}
}
async function ldI() { if (!isNative || S.noAds) return; try { const { AdMob } = await import(’@capacitor-community/admob’); await AdMob.prepareInterstitial({ adId: ADS.interstitial }); } catch(e){} }
async function ldR() { if (!isNative) return; try { const { AdMob } = await import(’@capacitor-community/admob’); await AdMob.prepareRewardVideoAd({ adId: ADS.rewarded }); } catch(e){} }

// Interstitiel 1/3 game over
let gc = 0;
const _origEG = window.eG;
if (_origEG) window.eG = function() { _origEG(); gc++; if (isNative && !S.noAds && !S.hasPrem && gc % 3 === 0 && adIntOk) import(’@capacitor-community/admob’).then(({ AdMob }) => AdMob.showInterstitial()).catch(() => {}); };

// Rewarded : continuer
const _origCn = window.dCn;
window.dCn = function() { if (!isNative || !adRewOk) { _origCn(); return; } adRewCb = () => _origCn(); import(’@capacitor-community/admob’).then(({ AdMob }) => AdMob.showRewardVideoAd()).catch(() => _origCn()); };

// Rewarded : ×2 coins
const _origX2 = window.dX2;
window.dX2 = function() { if (!isNative || !adRewOk) { _origX2(); return; } adRewCb = () => _origX2(); import(’@capacitor-community/admob’).then(({ AdMob }) => AdMob.showRewardVideoAd()).catch(() => _origX2()); };

// Rewarded : daily ×2
const _origD2 = window.claimD2;
window.claimD2 = function() { if (!isNative || !adRewOk) { _origD2(); return; } adRewCb = () => _origD2(); import(’@capacitor-community/admob’).then(({ AdMob }) => AdMob.showRewardVideoAd()).catch(() => _origD2()); };

// Haptics natifs
const _origVib = window.vib;
window.vib = async function(ms) { if (!isNative) { if (_origVib) _origVib(ms); return; } if (!S.vib) return; try { const { Haptics } = await import(’@capacitor/haptics’); await Haptics.impact({ style: Array.isArray(ms) ? ‘HEAVY’ : ms > 30 ? ‘MEDIUM’ : ‘LIGHT’ }); } catch (e) { if (_origVib) _origVib(ms); } };

// Restaurer achats natif
const _origRestore = window.restoreP;
window.restoreP = async function() { if (!isNative) { _origRestore(); return; } toast(‘🔄 Restauration…’, ‘ok’); try { const { InAppPurchases } = await import(’@capacitor/in-app-purchases’); await InAppPurchases.restorePurchases(); toast(‘✓ Restauré’, ‘ok’); } catch (e) { toast(‘Aucun achat trouvé’); } };

// RGPD + ATT natif
const _origGDPR = window.aGDPR;
window.aGDPR = async function(v) { _origGDPR(v); if (!isNative) return; if (platform === ‘ios’) { try { const { AdMob } = await import(’@capacitor-community/admob’); await AdMob.requestTrackingAuthorization(); } catch (e) {} } };

// Offre spéciale natif
const _origOf = window.buyOf;
window.buyOf = async function() { if (!isNative) { _origOf(); return; } if (!iapReady) { toast(‘Chargement…’, ‘er’); return; } try { const { InAppPurchases } = await import(’@capacitor/in-app-purchases’); await InAppPurchases.purchase({ productIdentifier: IAP.starter }); } catch (e) { toast(‘Erreur’, ‘er’); } };

// Status bar + lifecycle
async function initNative() {
if (!isNative) return;
try { const { StatusBar } = await import(’@capacitor/status-bar’); await StatusBar.setStyle({ style: ‘LIGHT’ }); await StatusBar.setBackgroundColor({ color: ‘#0b0618’ }); } catch (e) {}
try { const { App } = await import(’@capacitor/app’);
App.addListener(‘appStateChange’, ({ isActive }) => { if (!isActive && G.on && !G.pa) dP(); });
App.addListener(‘backButton’, () => { const o = document.querySelector(’.ov.sh’); if (o) { o.classList.remove(‘sh’); return; } if (G.on) { G.pa ? dQ() : dP(); } });
} catch (e) {}
await initIAP(); await initAds();
console.log(’[Native] Ready —’, platform);
}
document.readyState === ‘complete’ ? initNative() : document.addEventListener(‘DOMContentLoaded’, initNative);
