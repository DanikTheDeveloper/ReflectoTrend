import React from "react";
import '@mantine/core/styles.css';
import { useNavigate } from "react-router-dom";
import { Container, Grid, Card, Text, Badge, Group, Stack, Skeleton, Title } from '@mantine/core';
import { useSelector, useDispatch } from "react-redux";
import AppShell from "../../General/AppShell";
import classes from "./Landing.module.css";
import { IconTrendingUp, IconTrendingDown, IconRefresh } from "@tabler/icons-react";
import { getTrendingCoins } from "../../../store/TrendsSlice";
import type { RootState, AppDispatch } from "../../../store/types";
import type { TrendingCoin } from "../../../store/TrendsSlice";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const coins = useSelector((state: RootState) => state.trends.coins);
  const isLoading = useSelector((state: RootState) => state.trends.isLoading);
  const lastUpdate = useSelector((state: RootState) => state.trends.lastUpdate);

  const fetchTrending = () => {
    dispatch(getTrendingCoins());
  };

  React.useEffect(() => {
    fetchTrending();
    const interval = setInterval(fetchTrending, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number): string => {
    if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(6)}`;
  };

  const formatMarketCap = (cap: number): string => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toLocaleString()}`;
  };

  const formatUpdateTime = (isoString: string | null): string => {
    if (!isoString) return 'Never';
    return new Date(isoString).toLocaleTimeString();
  };

  return (
    <AppShell
      component={
        <div style={styles.container}>
          <Container size="xl" py={40}>
            
            <div style={styles.header}>
              <div>
                <Title order={1} style={styles.title}>
                  Top Gainers Today
                </Title>
                <Text style={styles.subtitle}>
                  Live market movers • Updated {formatUpdateTime(lastUpdate)}
                </Text>
              </div>
              <button onClick={fetchTrending} style={styles.refreshButton} disabled={isLoading}>
                <IconRefresh size={20} stroke={2} style={{ opacity: isLoading ? 0.5 : 1 }} />
                {isLoading ? 'Updating...' : 'Refresh'}
              </button>
            </div>

            {isLoading && coins.length === 0 ? (
              <Grid gutter="lg" mt={30}>
                {[...Array(10)].map((_, i) => (
                  <Grid.Col key={i} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                    <Skeleton height={220} radius="lg" />
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              <Grid gutter="lg" mt={30}>
                {coins.map((coin, index) => (
                  <Grid.Col 
                    key={coin.id} 
                    span={{ base: 12, sm: 6, md: 4, lg: 3 }}
                    style={{ 
                      animation: `fadeSlideIn 0.5s ease ${index * 0.05}s both`,
                    }}
                  >
                    <Card 
                      style={{
                        ...styles.card,
                        borderTop: `3px solid ${coin.price_change_percentage_24h >= 0 ? '#3BB266' : '#C13737'}`,
                      }}
                      onClick={() => navigate(`/chart/${coin.symbol}`)}
                    >
                      <Stack gap="md">
                        
                        <Group justify="space-between" align="flex-start">
                          <Group gap="sm">
                            <img 
                              src={coin.image} 
                              alt={coin.name}
                              style={styles.coinImage}
                            />
                            <div>
                              <Text style={styles.coinName}>{coin.name}</Text>
                              <Text style={styles.coinSymbol}>{coin.symbol.toUpperCase()}</Text>
                            </div>
                          </Group>
                          <Badge 
                            size="sm"
                            variant="light"
                            style={{
                              background: 'rgba(97,61,228,0.12)',
                              color: '#a78bfa',
                              border: '1px solid rgba(97,61,228,0.25)',
                            }}
                          >
                            #{coin.market_cap_rank}
                          </Badge>
                        </Group>

                        <div>
                          <Text style={styles.price}>
                            {formatPrice(coin.current_price)}
                          </Text>
                          <Group gap="xs" mt={4}>
                            {coin.price_change_percentage_24h >= 0 ? (
                              <IconTrendingUp size={16} color="#3BB266" stroke={2.5} />
                            ) : (
                              <IconTrendingDown size={16} color="#C13737" stroke={2.5} />
                            )}
                            <Text 
                              style={{
                                ...styles.priceChange,
                                color: coin.price_change_percentage_24h >= 0 ? '#3BB266' : '#C13737',
                              }}
                            >
                              {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                              {coin.price_change_percentage_24h.toFixed(2)}%
                            </Text>
                          </Group>
                        </div>

                        <div style={styles.statsGrid}>
                          <div>
                            <Text style={styles.statLabel}>Market Cap</Text>
                            <Text style={styles.statValue}>{formatMarketCap(coin.market_cap)}</Text>
                          </div>
                          <div>
                            <Text style={styles.statLabel}>24h Volume</Text>
                            <Text style={styles.statValue}>{formatMarketCap(coin.total_volume)}</Text>
                          </div>
                        </div>

                        <div style={styles.rangeBar}>
                          <div 
                            style={{
                              ...styles.rangeIndicator,
                              left: `${((coin.current_price - coin.low_24h) / (coin.high_24h - coin.low_24h)) * 100}%`,
                            }}
                          />
                          <Group justify="space-between" mt={4}>
                            <Text style={styles.rangeText}>L: {formatPrice(coin.low_24h)}</Text>
                            <Text style={styles.rangeText}>H: {formatPrice(coin.high_24h)}</Text>
                          </Group>
                        </div>

                      </Stack>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            )}

          </Container>
        </div>
      }
      selectedIndex={1}
    />
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(145deg, #1a2238 0%, #2c1a6a 45%, #1a2f5a 100%)',
    position: 'relative',
    marginTop: '20px',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '20px',
  },

  title: {
    fontSize: 'clamp(2rem, 4vw, 2.8rem)',
    fontWeight: 800,
    color: '#EDE9FF',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    letterSpacing: '-0.02em',
    marginBottom: '8px',
  },

  subtitle: {
    fontSize: '15px',
    color: 'rgba(167,139,250,0.65)',
    fontFamily: 'system-ui, sans-serif',
  },

  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    marginTop: '20px',
    background: 'rgba(97,61,228,0.15)',
    border: '1px solid rgba(97,61,228,0.30)',
    borderRadius: '10px',
    color: '#a78bfa',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  card: {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '16px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    height: '100%',
  },

  coinImage: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid rgba(167,139,250,0.2)',
  },

  coinName: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#EDE9FF',
    lineHeight: 1.2,
  },

  coinSymbol: {
    fontSize: '12px',
    color: 'rgba(167,139,250,0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600,
  },

  price: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#EDE9FF',
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: '-0.01em',
  },

  priceChange: {
    fontSize: '14px',
    fontWeight: 700,
    fontFamily: 'system-ui, sans-serif',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(167,139,250,0.12)',
  },

  statLabel: {
    fontSize: '11px',
    color: 'rgba(167,139,250,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
    marginBottom: '4px',
  },

  statValue: {
    fontSize: '13px',
    color: '#EDE9FF',
    fontWeight: 600,
  },

  rangeBar: {
    position: 'relative',
    paddingTop: '8px',
  },

  rangeIndicator: {
    position: 'absolute',
    top: 0,
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#FCE073',
    boxShadow: '0 0 8px rgba(252,224,115,0.6)',
    transform: 'translateX(-50%)',
  },

  rangeText: {
    fontSize: '11px',
    color: 'rgba(167,139,250,0.5)',
    fontWeight: 600,
  },
};

if (typeof document !== 'undefined' && !document.getElementById('home-animations')) {
  const style = document.createElement('style');
  style.id = 'home-animations';
  style.textContent = `
    @keyframes fadeSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    [style*="cursor: pointer"]:hover {
      transform: translateY(-4px) !important;
      box-shadow: 0 8px 24px rgba(97,61,228,0.25) !important;
      border-color: rgba(97,61,228,0.4) !important;
    }

    button[style*="refreshButton"]:hover:not([disabled]) {
      background: rgba(97,61,228,0.25) !important;
      border-color: rgba(97,61,228,0.5) !important;
    }

    button[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}

export default Home;
