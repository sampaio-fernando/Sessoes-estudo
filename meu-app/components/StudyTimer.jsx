import React, { useEffect, useRef, useState } from "react";
import {View, Text,  TextInput,  Pressable,  StyleSheet,
  Vibration, Platform,  Keyboard} from "react-native";
/**
 * Temporizador de Sessões de Estudo (React Native + Hooks)
 *
 * Estados principais:
 * - segundosRestantes (number) -> tempo restante em segundos
 * - ativo (boolean) -> se o timer está rodando
 * - sessoesCompletas (number)
 * - tempoTotalEstudado (number) -> em segundos
 * - tempoInicialMin (number) -> minutos configurados (opcional para reset)
 *
 * Hooks:
 * - useEffect para criar/limpar setInterval quando ativo
 * - useEffect para detectar quando segundosRestantes chega a 0
 */

export default function StudyTimer() {
  const [tempoInicialMin, setTempoInicialMin] = useState("25"); // string pra TextInput
  const [segundosRestantes, setSegundosRestantes] = useState(25 * 60);
  const [ativo, setAtivo] = useState(false);
  const [sessoesCompletas, setSessoesCompletas] = useState(0);
  const [tempoTotalEstudado, setTempoTotalEstudado] = useState(0); // em segundos
  const intervalRef = useRef(null);

  // Converte total segundos em "MM:SS"
  const formatarTempo = (totalSegundos) => {
    // cálculos cuidadosos (digito a digito mentalmente)
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    const mm = String(minutos).padStart(2, "0");
    const ss = String(segundos).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // Atualiza segundosRestantes quando muda o tempo inicial (input aplicado)
  const aplicarTempoInicial = () => {
    // converter string para inteiro com fallback
    const min = parseInt(tempoInicialMin, 10);
    const minutos = Number.isNaN(min) || min <= 0 ? 25 : min;
    setTempoInicialMin(String(minutos));
    setSegundosRestantes(minutos * 60);
    setAtivo(false);
    Keyboard.dismiss();
  };

  const iniciar = () => {
    if (segundosRestantes > 0) setAtivo(true);
  };

  const pausar = () => {
    setAtivo(false);
  };

  const resetar = () => {
    const min = parseInt(tempoInicialMin, 10);
    const minutos = Number.isNaN(min) || min <= 0 ? 25 : min;
    setAtivo(false);
    setSegundosRestantes(minutos * 60);
  };

  // useEffect: cria/limpa intervalo quando 'ativo' muda
  useEffect(() => {
    if (ativo) {
      // garante limpar qualquer intervalo anterior
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setSegundosRestantes((prev) => {
          // evitar ficar negativo
          if (prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);
    } else {
      // se não ativo, limpar
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // cleanup ao desmontar/componente atualizar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [ativo]);

  // useEffect: detectar quando chega a zero
  useEffect(() => {
    if (segundosRestantes === 0) {
      // parar o timer
      setAtivo(false);

      // incrementar sessões completadas
      setSessoesCompletas((s) => s + 1);

      // somar o tempo inicial (em segundos) ao total estudado
      // pega o tempoInicialMin atual
      const min = parseInt(tempoInicialMin, 10);
      const minutos = Number.isNaN(min) || min <= 0 ? 25 : min;
      setTempoTotalEstudado((t) => t + minutos * 60);

      // alertas opcionais: vibrar (Android/iOS)
      try {
        if (Platform.OS === "android") {
          // vibrar padrão
          Vibration.vibrate(500);
        } else {
          // iOS: sequência curta
          Vibration.vibrate();
        }
      } catch (e) {
        // se Vibration não suportado, falha silenciosa
      }
    }
  }, [segundosRestantes, tempoInicialMin]);

  // estilo dinâmico: tempo crítico < 60s
  const tempoCritico = segundosRestantes <= 60;

  // Exibir tempo total estudado em mm:ss ou em minutos/h
  const totalMinutos = Math.floor(tempoTotalEstudado / 60);
  const totalHoras = Math.floor(totalMinutos / 60);
  const exibicaoTempoTotal =
    totalHoras > 0
      ? `${totalHoras}h ${totalMinutos % 60}m`
      : `${totalMinutos} min`;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Temporizador de Estudo</Text>

      <View style={[styles.display, tempoCritico && styles.displayCritico]}>
        <Text style={styles.timeText}>{formatarTempo(segundosRestantes)}</Text>
      </View>

      {segundosRestantes === 0 && (
        <Text style={styles.finishedText}>🎉 Tempo encerrado!</Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={tempoInicialMin}
          onChangeText={setTempoInicialMin}
          keyboardType="numeric"
          placeholder="Minutos"
          returnKeyType="done"
          onSubmitEditing={aplicarTempoInicial}
        />
        <Pressable style={styles.applyBtn} onPress={aplicarTempoInicial}>
          <Text style={styles.applyBtnText}>Aplicar</Text>
        </Pressable>
      </View>

      <View style={styles.buttonsRow}>
        <Pressable
          onPress={iniciar}
          style={({ pressed }) => [
            styles.button,
            ativo && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          disabled={ativo || segundosRestantes === 0}
        >
          <Text style={styles.buttonText}>Iniciar</Text>
        </Pressable>

        <Pressable
          onPress={pausar}
          style={({ pressed }) => [
            styles.button,
            !ativo && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          disabled={!ativo}
        >
          <Text style={styles.buttonText}>Pausar</Text>
        </Pressable>

        <Pressable
          onPress={resetar}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Resetar</Text>
        </Pressable>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statText}>Sessões completas: {sessoesCompletas}</Text>
        <Text style={styles.statText}>Tempo total: {exibicaoTempoTotal}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    marginBottom: 12,
    fontWeight: "700",
  },
  display: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 10,
    backgroundColor: "#f0f4f8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  displayCritico: {
    backgroundColor: "#ffe6e6",
  },
  timeText: {
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: 2,
  },
  finishedText: {
    marginTop: 6,
    color: "#2e7d32",
    fontWeight: "700",
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d0d7de",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    textAlign: "center",
  },
  applyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#2f80ed",
    borderRadius: 8,
  },
  applyBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  buttonsRow: {
    flexDirection: "row",
    marginTop: 14,
    width: "100%",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 10,
    backgroundColor: "#1f2937",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#6b7280",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  stats: {
    marginTop: 16,
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
    paddingTop: 12,
    alignItems: "center",
  },
  statText: {
    fontSize: 14,
    color: "#374151",
    marginVertical: 2,
  },
});
