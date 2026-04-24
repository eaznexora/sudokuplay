import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, Alert, Dimensions } from 'react-native';
import { generateSudoku, checkCompletion, BLANK } from '../utils/sudoku';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 20, 380);
const CELL_SIZE = Math.floor(BOARD_SIZE / 9);

export default function GameScreen({ route, navigation }) {
  const { difficulty } = route.params || { difficulty: 'Medium' };

  const [board, setBoard] = useState(Array(9).fill(Array(9).fill(0)));
  const [initialBoard, setInitialBoard] = useState(Array(9).fill(Array(9).fill(0)));
  const [solution, setSolution] = useState(Array(9).fill(Array(9).fill(0)));
  const [selectedCell, setSelectedCell] = useState(null);
  const [timer, setTimer] = useState(0);
  const [hints, setHints] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const startNewGame = () => {
    const game = generateSudoku(difficulty);
    setBoard(game.puzzle);
    setInitialBoard(game.puzzle.map(row => [...row]));
    setSolution(game.solution);
    setTimer(0);
    setHints(3);
    setSelectedCell(null);
  };

  const handleNumberPress = (num) => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    if (initialBoard[r][c] !== BLANK) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    if (checkCompletion(newBoard, solution)) {
      setIsPaused(true);
      Alert.alert('🎉 Congratulations!', `You solved the ${difficulty} puzzle in ${formatTime(timer)}!`, [
        { text: 'Play Again', onPress: startNewGame },
        { text: 'Go Home', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const handleHint = () => {
    if (hints <= 0) { Alert.alert('No Hints Left'); return; }
    if (!selectedCell) { Alert.alert('Select Cell', 'Tap an empty cell first.'); return; }
    const [r, c] = selectedCell;
    if (initialBoard[r][c] !== BLANK || board[r][c] !== BLANK) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = solution[r][c];
    setBoard(newBoard);
    setHints(h => h - 1);

    if (checkCompletion(newBoard, solution)) {
      setIsPaused(true);
      Alert.alert('🎉 Solved!', 'Puzzle complete.', [
        { text: 'Go Home', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getCellStyle = (r, c) => {
    const styles = [cellStyles.cell];
    if ((c + 1) % 3 === 0 && c !== 8) styles.push(cellStyles.borderRight);
    if ((r + 1) % 3 === 0 && r !== 8) styles.push(cellStyles.borderBottom);
    if (selectedCell) {
      const [sr, sc] = selectedCell;
      if (sr === r && sc === c) styles.push(cellStyles.selected);
      else if (sr === r || sc === c) styles.push(cellStyles.highlighted);
      else {
        const boxR = Math.floor(sr / 3), boxC = Math.floor(sc / 3);
        if (Math.floor(r / 3) === boxR && Math.floor(c / 3) === boxC) styles.push(cellStyles.highlighted);
      }
    }
    const isInitial = initialBoard[r][c] !== BLANK;
    const cell = board[r][c];
    if (!isInitial && cell !== BLANK && cell !== solution[r][c]) styles.push(cellStyles.error);
    return styles;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.diffLabel}>{difficulty}</Text>
        </View>
        <Text style={styles.timer}>{formatTime(timer)}</Text>
      </View>

      <View style={styles.boardWrap}>
        <View style={[styles.grid, { width: CELL_SIZE * 9, height: CELL_SIZE * 9 }]}>
          {board.map((row, r) => (
            <View key={`row-${r}`} style={styles.row}>
              {row.map((cell, c) => {
                const isInitial = initialBoard[r][c] !== BLANK;
                return (
                  <TouchableOpacity
                    key={`cell-${r}-${c}`}
                    style={[getCellStyle(r, c), { width: CELL_SIZE, height: CELL_SIZE }]}
                    onPress={() => setSelectedCell([r, c])}
                    activeOpacity={0.7}
                  >
                    <Text style={[cellStyles.text, isInitial ? cellStyles.initialText : cellStyles.userText]}>
                      {cell !== BLANK ? cell : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleHint}>
          <Text style={styles.actionIcon}>💡</Text>
          <Text style={styles.actionLabel}>Hint ({hints})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleNumberPress(BLANK)}>
          <Text style={styles.actionIcon}>⌫</Text>
          <Text style={styles.actionLabel}>Erase</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={startNewGame}>
          <Text style={styles.actionIcon}>🔄</Text>
          <Text style={styles.actionLabel}>New Game</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.numpad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <TouchableOpacity
            key={`num-${num}`}
            style={styles.numButton}
            onPress={() => handleNumberPress(num)}
            activeOpacity={0.7}
          >
            <Text style={styles.numText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const cellStyles = StyleSheet.create({
  cell: {
    borderWidth: 0.5,
    borderColor: '#D1D1D6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  borderRight: { borderRightWidth: 2, borderRightColor: '#1A1A2E' },
  borderBottom: { borderBottomWidth: 2, borderBottomColor: '#1A1A2E' },
  selected: { backgroundColor: '#D6E4FF' },
  highlighted: { backgroundColor: '#F0F4FF' },
  error: { backgroundColor: '#FFE5E5' },
  text: { fontSize: 18, fontWeight: '500' },
  initialText: { color: '#1A1A2E', fontWeight: '700' },
  userText: { color: '#007AFF' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { fontSize: 16, color: '#007AFF', fontWeight: '500' },
  headerCenter: { alignItems: 'center' },
  diffLabel: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  timer: { fontSize: 16, fontWeight: '600', color: '#8E8E93', fontVariant: ['tabular-nums'] },
  boardWrap: { alignItems: 'center', marginVertical: 16 },
  grid: { borderWidth: 2, borderColor: '#1A1A2E' },
  row: { flexDirection: 'row' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 10,
  },
  actionBtn: { alignItems: 'center', gap: 2 },
  actionIcon: { fontSize: 22 },
  actionLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  numButton: {
    width: (SCREEN_WIDTH - 64) / 5,
    height: 52,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  numText: { fontSize: 22, color: '#FFF', fontWeight: '700' },
});
