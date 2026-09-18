import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { contractABI } from './contract'
import './App.css'

function App() {
  const [manager, setManager] = useState('');
  const [players, setPlayers] = useState([]);
  const [balance, setBalance] = useState('');
  const [value, setValue] = useState('');
  const [nickname, setNickname] = useState('');
  const [lastWinner, setLastWinner] = useState('');
  const [message, setMessage] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  
  // Зберігаємо адресу контракту у стані та в localStorage, щоб не вводити щоразу
  const [contractAddress, setContractAddress] = useState(
    localStorage.getItem('lotteryAddress') || '0x5FbDB2315678afecb367f032d93F642f64180aa3'
  );

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setCurrentAccount(accounts[0]);
            loadContractData(accounts[0]);
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

  const loadContractData = async (account = currentAccount) => {
    if (!contractAddress || !account) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      
      const managerAddress = await contract.manager();
      const playersList = await contract.getPlayers();
      const contractBalance = await provider.getBalance(contractAddress);
      
      try {
          const winner = await contract.lastWinnerNickname();
          setLastWinner(winner);
      } catch (e) {
          setLastWinner('');
          console.log("Останній переможець ще не визначений");
      }
      
      setManager(managerAddress);
      setPlayers(playersList);
      setBalance(ethers.formatEther(contractBalance));
      setMessage('Дані контракту успішно завантажено!');
    } catch (error) {
      console.error("Помилка завантаження даних", error);
      setMessage('Помилка: не вдалося завантажити контракт (перевірте адресу та мережу).');
      
      // Очищуємо дані, якщо контракт недійсний
      setManager('');
      setPlayers([]);
      setBalance('');
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setCurrentAccount(accounts[0]);
        loadContractData(accounts[0]);
        setMessage('Підключено успішно!');
      } catch (error) {
        setMessage('Помилка підключення: ' + error.message);
        console.error(error);
      }
    }
  };

  const handleSaveAddress = () => {
    localStorage.setItem('lotteryAddress', contractAddress);
    loadContractData();
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!nickname) {
        setMessage('Будь ласка, введіть свій нікнейм!');
        return;
    }
    if (!contractAddress) {
        setMessage('Будь ласка, вкажіть адресу смарт-контракту!');
        return;
    }

    setMessage('Очікування транзакції...');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      const tx = await contract.enter(nickname, {
        value: ethers.parseEther(value)
      });
      
      await tx.wait();
      setMessage('Ви успішно стали учасником лотереї!');
      loadContractData(); // Оновлюємо дані без перезавантаження сторінки
      setValue('');
      setNickname('');
    } catch (error) {
      setMessage('Помилка транзакції!');
      console.error(error);
    }
  };

  const onClick = async () => {
    if (!contractAddress) return;
    setMessage('Визначення переможця...');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      const tx = await contract.pickWinner();
      await tx.wait();
      
      setMessage('Переможця визначено!');
      loadContractData(); // Оновлюємо дані
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
        <p>Підключено: <strong>{currentAccount}</strong></p>
      )}

      {/* Блок налаштування адреси смарт-контракту */}
      <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px', margin: '20px 0', color: '#333' }}>
        <h3>Налаштування контракту</h3>
        <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
          Вставте адресу розгорнутого контракту сюди:
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <input 
            type="text" 
            style={{ width: '350px', padding: '8px' }}
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x..."
          />
          <button onClick={handleSaveAddress} style={{ padding: '8px 15px' }}>
            Завантажити
          </button>
        </div>
      </div>

      {manager ? (
        <>
          <p>Цей контракт управляється адресою: <br/><strong>{manager}</strong></p>
          
          <p>
            В лотереї беруть участь <strong>{players.length}</strong> гравців. 
            Загальний пул складає <strong>{balance}</strong> ether.
          </p>

          {players.length > 0 && (
            <div>
              <h3>Список учасників:</h3>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {players.map((p, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>
                    <strong>{p.nickname}</strong> <span>({p.playerAddress})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lastWinner && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '5px', border: '1px solid #c3e6cb' }}>
              <h2>🎉 Останній переможець: {lastWinner} 🎉</h2>
            </div>
          )}

          <hr style={{ margin: '30px 0' }} />

          <form onSubmit={onSubmit}>
            <h2>Спробуй свою удачу!</h2>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Ваш нікнейм:</label>
              <input 
                type="text" 
                value={nickname}
                onChange={event => setNickname(event.target.value)} 
                required
                style={{ padding: '8px', width: '200px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Сума ефіру (мінімум 0.01 ETH):</label>
              <input 
                type="text" 
                value={value}
                onChange={event => setValue(event.target.value)} 
                required
                style={{ padding: '8px', width: '200px' }}
              />
            </div>
            <button type="submit" style={{ padding: '10px 20px', fontSize: '16px' }}>Взяти участь</button>
          </form>

          <hr style={{ margin: '30px 0' }} />

          <h2>Готові визначити переможця? <br/><span style={{fontSize: '16px'}}>(Тільки для менеджера)</span></h2>
          <button onClick={onClick} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
            Визначити переможця
          </button>
        </>
      ) : (
        <p style={{ color: 'gray', marginTop: '30px' }}>Введіть вірну адресу контракту та натисніть "Завантажити", щоб побачити лотерею.</p>
      )}

      <hr style={{ margin: '30px 0' }} />

      <h3 style={{ color: message.includes('Помилка') ? '#dc3545' : '#28a745' }}>{message}</h3>
    </div>
  )
}

export default App;
