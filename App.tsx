import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  SafeAreaView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Parse from 'parse/react-native.js';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PARSE_APP_ID, PARSE_JS_KEY, PARSE_SERVER_URL } from '@env';

// Configuração do Parse
Parse.setAsyncStorage(AsyncStorage);
Parse.initialize(PARSE_APP_ID, PARSE_JS_KEY);
Parse.serverURL = PARSE_SERVER_URL;

export default function App() {
  const [descricao, setDescricao] = useState('');
  const [tarefas, setTarefas] = useState([]);
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    listarTarefas();
  }, []);

  const adicionarOuAtualizarTarefa = async () => {
    if (!descricao.trim()) return;

    if (editandoId) {
      const query = new Parse.Query('Tarefa');
      try {
        const tarefa = await query.get(editandoId);
        tarefa.set('descricao', descricao);
        await tarefa.save();
        setDescricao('');
        setEditandoId(null);
        listarTarefas();
      } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
      }
    } else {
      const Tarefa = new Parse.Object('Tarefa');
      Tarefa.set('descricao', descricao);
      Tarefa.set('concluida', false);

      try {
        await Tarefa.save();
        setDescricao('');
        listarTarefas();
      } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
      }
    }
  };

  const listarTarefas = async () => {
    const Tarefa = Parse.Object.extend('Tarefa');
    const query = new Parse.Query(Tarefa);
    query.descending('createdAt');

    try {
      const resultados = await query.find();
      setTarefas(
        resultados.map((tarefa) => ({
          id: tarefa.id,
          descricao: tarefa.get('descricao'),
          concluida: tarefa.get('concluida'),
          object: tarefa,
        }))
      );
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    }
  };

  const toggleConclusao = async (tarefa) => {
    const objeto = tarefa.object;
    objeto.set('concluida', !tarefa.concluida);

    try {
      await objeto.save();
      listarTarefas();
    } catch (error) {
      console.error('Erro ao atualizar conclusão:', error);
    }
  };

  const editarTarefa = (tarefa) => {
    setDescricao(tarefa.descricao);
    setEditandoId(tarefa.id);
  };

  const excluirTarefa = async (tarefa) => {
    Alert.alert('Excluir tarefa', 'Tem certeza que deseja excluir esta tarefa?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await tarefa.object.destroy();
            listarTarefas();
          } catch (error) {
            console.error('Erro ao excluir tarefa:', error);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>📝 Minhas Tarefas</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Nova tarefa..."
          style={styles.input}
          value={descricao}
          onChangeText={setDescricao}
        />
        <Button
          title={editandoId ? 'Atualizar' : 'Adicionar'}
          onPress={adicionarOuAtualizarTarefa}
          color={editandoId ? '#2196F3' : '#4CAF50'}
        />
      </View>

      {tarefas.length === 0 ? (
        <Text style={styles.msgVazia}>Nenhuma tarefa cadastrada.</Text>
      ) : (
        <FlatList
          data={tarefas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <View style={styles.itemTextContainer}>
                <Text
                  style={[
                    styles.itemText,
                    item.concluida && styles.itemConcluida,
                  ]}
                >
                  {item.descricao}
                </Text>
              </View>

              <Switch
                value={item.concluida}
                onValueChange={() => toggleConclusao(item)}
                trackColor={{ false: '#ccc', true: '#4CAF50' }}
                thumbColor={item.concluida ? '#ffffff' : '#f4f3f4'}
              />

              <TouchableOpacity onPress={() => editarTarefa(item)}>
                <Text style={styles.botaoEditar}>✏️</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => excluirTarefa(item)}>
                <Text style={styles.botaoExcluir}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    elevation: 3,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  itemText: {
    fontSize: 18,
    color: '#333',
  },
  itemConcluida: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  botaoEditar: {
    fontSize: 18,
    marginHorizontal: 8,
  },
  botaoExcluir: {
    fontSize: 18,
    color: 'red',
  },
  msgVazia: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
    fontSize: 16,
  },
});
