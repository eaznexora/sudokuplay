import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { generateSudoku, checkCompletion, isValid, BLANK } from '../utils/sudoku';

export default function GameScreen({ route, navigation }) {
  const { difficulty } = route.params || { difficulty: 'Medium' };
  
  const [board, setBoard] = useState(Array(9).fill(Array(9).fill(0)));
  const [initialBoard, setInitialBoard] = useState(Array(9).fill(Array(9).fill(0)));
  const [solution, setSolution] = useState(Array(9).fill(Array(9).fill(0)));
  const [selectedCell, setSelectedCell] = useState(null); // [row, col]
  const [timer, setTimer] = useState(0);
  const [hints, setHints] = useState(3);

  useEffect(() => {
    startNewGame();
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
    
    // Don't modify initial given numbers
    if (initialBoard[r][c] !== BLANK) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    if (checkCompletion(newBoard, solution)) {
      Alert.alert('Congratulations!', `You solved the ${difficulty} puzzle in ${formatTime(timer)}!`, [
        { text: 'Play Again', onPress: startNewGame },
        { text: 'Go Home', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const handleHint = () => {
    if (hints <= 0 || !selectedCell) {
      Alert.alert('Hint', hints <= 0 ? 'No hints left!' : 'Select an empty cell first.');
      return;
    }
    const [r, c] = selectedCell;
    if (initialBoard[r][c] !== BLANK || board[r][c] !== BLANK) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = solution[r][c];
    setBoard(newBoard);
    setHints(h => h - 1);

    if (checkCompletion(newBoard, solution)) {
      Alert.alert('Congratulations!', `You solved it!`, [
        { text: 'Go Home', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{difficulty} Game</Text>
        <Text style={styles.timer}>{formatTime(timer)}</Text>
      </View>

      <View style={styles.boardContainer}>
        <View style={styles.grid}>
          {board.map((row, r) => (
            <View key={`row-${r}`} style={styles.row}>
              {row.map((cell, c) => {
                const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
                const isInitial = initialBoard[r][c] !== BLANK;
                const isError = cell !== BLANK && !isInitial && cell !== solution[r][c];
                
                return (
                  <TouchableOpacity
                    key={`cell-${r}-${c}`}
                    style={[
                      styles.cell,
                      (c + 1) % 3 === 0 && c !== 8 ? styles.borderRight : null,
                      (r + 1) % 3 === 0 && r !== 8 ? styles.borderBottom : null,
                      isSelected ? styles.selectedCell : null,
                      isError ? styles.errorCell : null
                    ]}
                    onPress={() => setSelectedCell([r, c])}
                  >
                    <Text style={[
                      styles.cellText,
                      isInitial ? styles.initialText : styles.userText
                    ]}>
                      {cell !== BLANK ? cell : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.actionButton} onPress={handleHint}>
          <Text style={styles.actionText}>Hint ({hints})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleNumberPress(BLANK)}>
          <Text style={styles.actionText}>Erase</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.numpad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <TouchableOpacity 
            key={`num-${num}`} 
            style={styles.numButton}
            onPress={() => handleNumberPress(num)}
          >
            <Text style={styles.numText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerButton: { fontSize: 16, color: '#007AFF' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  timer: { fontSize: 16, fontVariant: ['tabular-nums'] },
  boardContainer: { alignItems: 'center', marginVertical: 20 },
  grid: { borderWidth: 2, borderColor: '#333', backgroundColor: '#FFF' },
  row: { flexDirection: 'row' },
  cell: {
    width: 40, height: 40, borderWidth: 0.5, borderColor: '#CCC',
    justifyContent: 'center', alignItems: 'center'
  },
  borderRight: { borderRightWidth: 2, borderRightColor: '#333' },
  borderBottom: { borderBottomWidth: 2, borderBottomColor: '#333' },
  selectedCell: { backgroundColor: '#E3F2FD' },
  errorCell: { backgroundColor: '#FFEBEE' },
  cellText: { fontSize: 20, fontWeight: '500' },
  initialText: { color: '#333' },
  userText: { color: '#007AFF' },
  controls: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  actionButton: { padding: 10, borderRadius: 8, backgroundColor: '#F0F0F0', minWidth: 100, alignItems: 'center' },
  actionText: { fontSize: 16, color: '#333' },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 10, gap: 10 },
  numButton: {
    width: '30%', height: 60, backgroundColor: '#007AFF', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2
  },
  numText: { fontSize: 24, color: '#FFF', fontWeight: 'bold' }
});
