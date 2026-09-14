import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { contractAddress, contractABI } from './contract'
import './App.css'

function App() {
  const [manager, setManager] = useState('');
  const [players, setPlayers] = useState([]);
  const [balance, setBalance] = useState('');
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setCurrentAccount(accounts[0]);
            loadContractData();
          }
        } catch (error) {
          console.error("Помилка перевірки підключення", error);
        }
      } else {
        setMessage('Будь ласка, встановіть MetaMask');
      }
    };
    checkConnection();
  }, []);

  const loadContractData = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      
      const managerAddress = await contract.manager();
      const playersList = await contract.getPlayers();
      const contractBalance = await provider.getBalance(contractAddress);
      
      setManager(managerAddress);
      setPlayers(playersList);
      setBalance(ethers.formatEther(contractBalance));
    } catch (error) {
      console.error("Помилка завантаження даних контракту", error);
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setCurrentAccount(accounts[0]);
        loadContractData();
        setMessage('Підключено успішно!');
      } catch (error) {
        setMessage('Помилка підключення: ' + error.message);
        console.error(error);
      }
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage('Очікування транзакції...');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      const tx = await contract.enter({
        value: ethers.parseEther(value)
      });
      
      await tx.wait();
      setMessage('Ви успішно стали учасником лотереї!');
      window.location.reload();
    } catch (error) {
      setMessage('Помилка транзакції!');
      console.error(error);
    }
  };

  const onClick = async () => {
    setMessage('Визначення переможця...');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      const tx = await contract.pickWinner();
      await tx.wait();
      
      setMessage('Переможця визначено!');
      window.location.reload();
    } catch (error) {
      setMessage('Помилка при визначенні переможця (можливо, ви не менеджер)');
      console.error(error);
    }
  };

  return (
    <div className="App">
      <h1>Лотерея на Смарт-Контракті</h1>
      
      {!currentAccount ? (
        <button onClick={connectWallet}>Підключити MetaMask</button>
      ) : (
        <p>Підключено: {currentAccount}</p>
      )}

      <p>
        Цей контракт управляється адресою: <strong>{manager}</strong>
      </p>
      <p>
        В лотереї беруть участь <strong>{players.length}</strong> гравців. 
        Загальний пул складає <strong>{balance}</strong> ether.
      </p>

      <hr />

      <form onSubmit={onSubmit}>
        <h2>Спробуй свою удачу!</h2>
        <div>
          <label>Сума ефіру для участі (мінімум 0.01 ETH): </label>
          <input 
            type="text" 
            value={value}
            onChange={event => setValue(event.target.value)} 
          />
        </div>
        <button>Взяти участь</button>
      </form>

      <hr />

      <h2>Готові визначити переможця? (Тільки для менеджера)</h2>
      <button onClick={onClick}>Визначити переможця</button>

      <hr />

      <h2>{message}</h2>
    </div>
  )
}

export default App;
