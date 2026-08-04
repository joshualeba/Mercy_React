import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';

const HTML_LOADER = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;
  }
  .loader {
    --color-one: #ffbf48;
    --color-two: #be4a1d;
    --color-three: #ffbf4780;
    --color-four: #bf4a1d80;
    --color-five: #ffbf4740;
    --time-animation: 2s;
    --size: 1.2;
    position: relative;
    border-radius: 50%;
    transform: scale(var(--size));
    box-shadow:
      0 0 25px 0 var(--color-three),
      0 20px 50px 0 var(--color-four);
    animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
  }
  .loader::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border-top: solid 1px var(--color-one);
    border-bottom: solid 1px var(--color-two);
    background: linear-gradient(180deg, var(--color-five), var(--color-four));
    box-shadow:
      inset 0 10px 10px 0 var(--color-three),
      inset 0 -10px 10px 0 var(--color-four);
  }
  .loader .box {
    width: 100px;
    height: 100px;
    background: linear-gradient(
      180deg,
      var(--color-one) 30%,
      var(--color-two) 70%
    );
    mask: url(#clipping);
    -webkit-mask: url(#clipping);
  }
  .loader svg {
    position: absolute;
  }
  .loader svg #clipping {
    filter: contrast(15);
    animation: roundness calc(var(--time-animation) / 2) linear infinite;
  }
  .loader svg #clipping polygon {
    filter: blur(7px);
  }
  .loader svg #clipping polygon:nth-child(1) {
    transform-origin: 75% 25%;
    transform: rotate(90deg);
  }
  .loader svg #clipping polygon:nth-child(2) {
    transform-origin: 50% 50%;
    animation: rotation var(--time-animation) linear infinite reverse;
  }
  .loader svg #clipping polygon:nth-child(3) {
    transform-origin: 50% 60%;
    animation: rotation var(--time-animation) linear infinite;
    animation-delay: calc(var(--time-animation) / -3);
  }
  .loader svg #clipping polygon:nth-child(4) {
    transform-origin: 40% 40%;
    animation: rotation var(--time-animation) linear infinite reverse;
  }
  .loader svg #clipping polygon:nth-child(5) {
    transform-origin: 40% 40%;
    animation: rotation var(--time-animation) linear infinite reverse;
    animation-delay: calc(var(--time-animation) / -2);
  }
  .loader svg #clipping polygon:nth-child(6) {
    transform-origin: 60% 40%;
    animation: rotation var(--time-animation) linear infinite;
  }
  .loader svg #clipping polygon:nth-child(7) {
    transform-origin: 60% 40%;
    animation: rotation var(--time-animation) linear infinite;
    animation-delay: calc(var(--time-animation) / -1.5);
  }
  @keyframes rotation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes roundness {
    0%, 60%, 100% { filter: contrast(15); }
    20%, 40% { filter: contrast(3); }
  }
  @keyframes colorize {
    0%, 100% { filter: hue-rotate(0deg); }
    20% { filter: hue-rotate(-30deg); }
    40% { filter: hue-rotate(-60deg); }
    60% { filter: hue-rotate(-90deg); }
    80% { filter: hue-rotate(-45deg); }
  }
</style>
</head>
<body>
<div class="loader">
  <svg width="100" height="100" viewBox="0 0 100 100">
    <defs>
      <mask id="clipping">
        <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
        <polygon points="25,25 75,25 50,75" fill="white"></polygon>
        <polygon points="50,25 75,75 25,75" fill="white"></polygon>
        <polygon points="35,35 65,35 50,65" fill="white"></polygon>
        <polygon points="35,35 65,35 50,65" fill="white"></polygon>
        <polygon points="35,35 65,35 50,65" fill="white"></polygon>
        <polygon points="35,35 65,35 50,65" fill="white"></polygon>
      </mask>
    </defs>
  </svg>
  <div class="box"></div>
</div>
</body>
</html>
`;

const FRASES = [
  "Preparando la experiencia para ti...",
  "Calculando tu mejor futuro...",
  "Sincronizando con los mercados financieros...",
  "Afinando los motores financieros...",
  "Analizando las mejores oportunidades...",
  "Asegurando tu conexión bancaria..."
];

export default function FullScreenLoader({ visible, text }) {
  const [fraseActiva, setFraseActiva] = useState(FRASES[0]);

  useEffect(() => {
    if (visible) {
      if (text && text.includes("Creando cuenta")) {
        setFraseActiva("Forjando tu nueva identidad financiera...");
      } else {
        const randomIndex = Math.floor(Math.random() * FRASES.length);
        setFraseActiva(FRASES[randomIndex]);
      }
    }
  }, [visible, text]);

  if (!visible) return null;

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(10, 25, 47, 0.98)', 'rgba(28, 58, 107, 0.98)']}
          style={styles.gradient}
        >
          <View style={styles.loaderWrapper}>
              <WebView
                originWhitelist={['*']}
                source={{ html: HTML_LOADER }}
                style={styles.webview}
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                bounces={false}
                opaque={false}
                backgroundColor="transparent"
              />
          </View>
          <Text style={styles.text}>{fraseActiva}</Text>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderWrapper: {
    width: 200,
    height: 200,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  webview: {
    width: 200,
    height: 200,
    backgroundColor: 'transparent',
  },
  text: {
    marginTop: 20,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
