import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

const API_TORNEOS_URL = 'https://futsal-k08n.onrender.com/api/torneos';

export default function TorneosScreen({ route, navigation }) {
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTorneoId, setSelectedTorneoId] = useState(null);

  // Consumir GET /api/torneos desde Render en tiempo real
  const fetchTorneos = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else if (!torneos.length) setLoading(true);

    try {
      const response = await axios.get(API_TORNEOS_URL, { timeout: 30000 });
      if (Array.isArray(response.data) && response.data.length > 0) {
        setTorneos(response.data);

        // Si no hay torneo seleccionado o viene por parámetro de navegación
        const targetId = route?.params?.torneoId;
        setSelectedTorneoId((prevId) => {
          if (targetId && response.data.some((t) => t.id === targetId)) {
            return targetId;
          }
          if (prevId && response.data.some((t) => t.id === prevId)) {
            return prevId;
          }
          // Por defecto seleccionar el más reciente (último creado)
          return response.data[response.data.length - 1].id;
        });
      }
    } catch (err) {
      console.warn('Error al sincronizar torneos con Render:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [route?.params?.torneoId, torneos.length]);

  // 1. Al enfocar la pantalla (cuando el usuario cambia a esta pestaña)
  useFocusEffect(
    useCallback(() => {
      fetchTorneos(false);
    }, [fetchTorneos])
  );

  // 2. Polling automático cada 10 segundos para detectar nuevos torneos agregados en el admin de escritorio
  useEffect(() => {
    fetchTorneos(false);
    const interval = setInterval(() => {
      fetchTorneos(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchTorneos]);

  // Torneo actualmente visualizado
  const currentTorneo = useMemo(() => {
    if (!torneos.length) return null;
    return torneos.find((t) => t.id === selectedTorneoId) || torneos[torneos.length - 1] || torneos[0];
  }, [torneos, selectedTorneoId]);

  // Partidos del torneo
  const partidos = useMemo(() => {
    return currentTorneo?.partidosTorneo || [];
  }, [currentTorneo]);

  // Equipos del torneo
  const equipos = useMemo(() => {
    return currentTorneo?.equipos || [];
  }, [currentTorneo]);

  // Campeón oficial si el torneo está finalizado
  const campeonTorneo = useMemo(() => {
    if (!currentTorneo) return null;
    const isFin = currentTorneo.estadoId === 3 || currentTorneo.estadoTorneo?.nombreEstado?.toLowerCase() === "finalizado";
    if (!isFin) return null;
    const pts = currentTorneo.partidosTorneo || [];
    if (!pts.length) return null;
    const ultimo = pts[pts.length - 1];
    if (ultimo?.ganadorId) {
      const eq = (currentTorneo.equipos || []).find((e) => e.id === ultimo.ganadorId);
      return eq?.nombreEquipo || `Equipo #${ultimo.ganadorId}`;
    }
    return null;
  }, [currentTorneo]);

  // Resuelve el nombre del equipo participante
  const getTeamName = (equipoId, equipoObj, fallback) => {
    if (equipoObj?.nombreEquipo) return equipoObj.nombreEquipo;
    if (!equipoId) return fallback || 'Pase Directo';
    const found = equipos.find((e) => e.id === equipoId);
    return found?.nombreEquipo || `Equipo #${equipoId}`;
  };

  // Identificar el ID del torneo más reciente
  const newestTorneoId = useMemo(() => {
    if (!torneos.length) return null;
    return torneos.reduce((max, t) => (t.id > max ? t.id : max), torneos[0].id);
  }, [torneos]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header Superior */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.brandTitle}>FUTSALPRO</Text>
          <Text style={styles.subTitle}>Torneos en Vivo y Llaves de Partidos</Text>
        </View>
        <TouchableOpacity
          onPress={() => fetchTorneos(true)}
          style={styles.refreshButton}
          activeOpacity={0.7}
        >
          {loading || refreshing ? (
            <ActivityIndicator size="small" color="#38BDF8" />
          ) : (
            <Text style={styles.refreshButtonText}>↻ Actualizar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Selector de Navegación Rápida entre Módulos */}
      <View style={styles.topSegmentContainer}>
        <TouchableOpacity
          style={styles.segmentBtn}
          onPress={() => navigation?.navigate('Reservas')}
          activeOpacity={0.7}
        >
          <Text style={styles.segmentText}>📅 Ir a Reservas de Cancha</Text>
        </TouchableOpacity>
        <View style={[styles.segmentBtn, styles.segmentBtnActive]}>
          <Text style={styles.segmentTextActive}>🏆 Torneos y Fixture</Text>
        </View>
      </View>

      {/* Selector Dinámico de Torneos (Se actualiza con cada torneo creado en la Web) */}
      <View style={styles.torneosSelectorContainer}>
        <View style={styles.torneosHeaderRow}>
          <Text style={styles.selectorLabel}>CAMPEONATOS ACTIVOS</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{torneos.length} en total</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.torneosScroll}
        >
          {torneos.map((torneo) => {
            const isSelected = torneo.id === currentTorneo?.id;
            const isNew = torneo.id === newestTorneoId && torneos.length > 1;

            return (
              <TouchableOpacity
                key={torneo.id}
                style={[styles.torneoChip, isSelected && styles.torneoChipActive]}
                onPress={() => setSelectedTorneoId(torneo.id)}
                activeOpacity={0.7}
              >
                <View style={styles.chipContent}>
                  <Text
                    style={[
                      styles.torneoChipText,
                      isSelected && styles.torneoChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    🏆 {torneo.nombre}
                  </Text>
                  {isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NUEVO</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTorneos(true)}
            tintColor="#38BDF8"
            colors={['#38BDF8']}
          />
        }
      >
        {/* Banner Informativo del Torneo Seleccionado */}
        {currentTorneo ? (
          <View style={styles.tournamentBanner}>
            <View style={styles.bannerHeader}>
              <View style={styles.bannerTitleBox}>
                <Text style={styles.bannerTitle}>{currentTorneo.nombre}</Text>
                <Text style={styles.bannerTorneoId}>Torneo Oficial #{currentTorneo.id}</Text>
              </View>
              <View style={styles.badgeProgramado}>
                <Text style={styles.badgeProgramadoText}>
                  {currentTorneo.estado || 'Activo'}
                </Text>
              </View>
            </View>

            <View style={styles.bannerDetails}>
              <Text style={styles.bannerDetailItem}>
                Categoría: <Text style={styles.bannerDetailHighlight}>{currentTorneo.rangoEdad}</Text>
              </Text>
              <Text style={styles.bannerDetailItem}>
                Inicio:{' '}
                <Text style={styles.bannerDetailHighlight}>
                  {currentTorneo.fechaInicio ? currentTorneo.fechaInicio.split('T')[0] : 'Por disputar'}
                </Text>
              </Text>
              <Text style={styles.bannerDetailItem}>
                Equipos:{' '}
                <Text style={styles.bannerDetailHighlight}>
                  {equipos.length} participantes
                </Text>
              </Text>
              <Text style={styles.bannerDetailItem}>
                Partidos:{' '}
                <Text style={styles.bannerDetailHighlight}>
                  {partidos.length} programados
                </Text>
              </Text>
            </View>
          </View>
        ) : loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.loadingBoxText}>Sincronizando torneos con el servidor...</Text>
          </View>
        ) : null}

        {/* Sección de Fixture y Llaves */}
        <View style={styles.fixtureSectionHeader}>
          <Text style={styles.fixtureSectionTitle}>ESQUEMA DE LLAVES Y PARTIDOS</Text>
          <Text style={styles.fixtureSectionSub}>
            Resultados actualizados en vivo desde el panel administrativo
          </Text>
        </View>

        {partidos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⏳</Text>
            <Text style={styles.emptyTitle}>Sin partidos configurados aún</Text>
            <Text style={styles.emptySub}>
              Las llaves para este torneo se generarán y mostrarán en breve.
            </Text>
          </View>
        ) : (
          <View style={styles.bracketContainer}>
            {partidos.map((partido, index) => {
              const localNombre = getTeamName(
                partido.equipoLocalId,
                partido.equipoLocal,
                'Equipo Local'
              );
              const visitaNombre = partido.equipoVisitaId
                ? getTeamName(partido.equipoVisitaId, partido.equipoVisita, 'Equipo Visita')
                : 'Pase Directo (Sin Rival)';

              const hasResult =
                partido.golesLocal !== null &&
                partido.golesLocal !== undefined &&
                partido.golesVisita !== null &&
                partido.golesVisita !== undefined;

              const isDirectPass = !partido.equipoVisitaId;
              const ganadorLocal =
                hasResult &&
                (partido.ganadorId === partido.equipoLocalId ||
                  partido.golesLocal > partido.golesVisita);
              const ganadorVisita =
                hasResult &&
                (partido.ganadorId === partido.equipoVisitaId ||
                  partido.golesVisita > partido.golesLocal);

              return (
                <View key={partido.id ?? index} style={styles.matchCard}>
                  {/* Encabezado de la Tarjeta del Partido */}
                  <View style={styles.cardHeader}>
                    <View style={styles.phaseBadge}>
                      <Text style={styles.phaseBadgeText}>
                        {partido.fase || `Llave #${index + 1}`}
                      </Text>
                    </View>
                    {isDirectPass ? (
                      <View style={styles.directPassBadge}>
                        <Text style={styles.directPassText}>PASE DIRECTO</Text>
                      </View>
                    ) : hasResult ? (
                      <View style={styles.finishedBadge}>
                        <Text style={styles.finishedBadgeText}>FINALIZADO</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>PENDIENTE</Text>
                      </View>
                    )}
                  </View>

                  {/* Cuerpo del Partido (Local vs Visita) */}
                  <View style={styles.matchBody}>
                    {/* Fila Equipo Local */}
                    <View style={[styles.teamRow, ganadorLocal && styles.teamRowWinner]}>
                      <View style={styles.teamNameBox}>
                        <View
                          style={[
                            styles.teamDot,
                            ganadorLocal ? styles.teamDotWinner : styles.teamDotNormal,
                          ]}
                        />
                        <Text
                          style={[
                            styles.teamName,
                            ganadorLocal && styles.teamNameWinner,
                          ]}
                          numberOfLines={1}
                        >
                          {localNombre}
                        </Text>
                        {ganadorLocal && (
                          <Text style={styles.winnerBadgeSmall}>✓ Ganador</Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.scoreBadge,
                          ganadorLocal && styles.scoreBadgeWinner,
                        ]}
                      >
                        <Text
                          style={[
                            styles.scoreText,
                            ganadorLocal && styles.scoreTextWinner,
                          ]}
                        >
                          {hasResult ? partido.golesLocal : '-'}
                        </Text>
                      </View>
                    </View>

                    {/* Separador VS */}
                    <View style={styles.vsSeparator}>
                      <View style={styles.vsLine} />
                      <Text style={styles.vsText}>VS</Text>
                      <View style={styles.vsLine} />
                    </View>

                    {/* Fila Equipo Visitante */}
                    <View style={[styles.teamRow, ganadorVisita && styles.teamRowWinner]}>
                      <View style={styles.teamNameBox}>
                        <View
                          style={[
                            styles.teamDot,
                            isDirectPass
                              ? styles.teamDotPass
                              : ganadorVisita
                              ? styles.teamDotWinner
                              : styles.teamDotNormal,
                          ]}
                        />
                        <Text
                          style={[
                            styles.teamName,
                            isDirectPass && styles.teamNamePass,
                            ganadorVisita && styles.teamNameWinner,
                          ]}
                          numberOfLines={1}
                        >
                          {visitaNombre}
                        </Text>
                        {ganadorVisita && (
                          <Text style={styles.winnerBadgeSmall}>✓ Ganador</Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.scoreBadge,
                          ganadorVisita && styles.scoreBadgeWinner,
                        ]}
                      >
                        <Text
                          style={[
                            styles.scoreText,
                            ganadorVisita && styles.scoreTextWinner,
                          ]}
                        >
                          {isDirectPass ? '—' : hasResult ? partido.golesVisita : '-'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Resumen al pie del partido */}
                  <View style={styles.cardFooter}>
                    {isDirectPass ? (
                      <Text style={styles.footerNote}>
                        🌟 Clasificado automáticamente a la siguiente ronda
                      </Text>
                    ) : hasResult ? (
                      <Text style={styles.footerWinner}>
                        Vencedor:{' '}
                        <Text style={styles.footerWinnerName}>
                          {ganadorLocal ? localNombre : ganadorVisita ? visitaNombre : 'Empate'}
                        </Text>
                      </Text>
                    ) : (
                      <Text style={styles.footerPending}>
                        ⏳ Pendiente de disputa del partido
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Sección de Equipos Participantes */}
        {equipos.length > 0 && (
          <View style={styles.equiposCard}>
            <Text style={styles.equiposTitle}>
              EQUIPOS PARTICIPANTES ({equipos.length})
            </Text>
            <View style={styles.equiposGrid}>
              {equipos.map((eq, i) => (
                <View key={eq.id ?? i} style={styles.equipoPill}>
                  <Text style={styles.equipoIndex}>{i + 1}</Text>
                  <View style={styles.equipoInfo}>
                    <Text style={styles.equipoNombreText}>{eq.nombreEquipo}</Text>
                    {eq.nombreRepresentante && (
                      <Text style={styles.equipoRepText}>
                        Representante: {eq.nombreRepresentante}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleContainer: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 1.5,
  },
  subTitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  refreshButtonText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  topSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#0B1120',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  segmentBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#38BDF8',
  },
  segmentText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  torneosSelectorContainer: {
    backgroundColor: '#0F172A',
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  torneosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  countBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
  },
  torneosScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  torneoChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  torneoChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#38BDF8',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  torneoChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  torneoChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  newBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  tournamentBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bannerTitleBox: {
    flex: 1,
    marginRight: 8,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  bannerTorneoId: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  badgeProgramado: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#059669',
  },
  badgeProgramadoText: {
    color: '#6EE7B7',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeFinalizado: {
    backgroundColor: '#78350F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  badgeFinalizadoText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeCancelado: {
    backgroundColor: '#4C0519',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E11D48',
  },
  badgeCanceladoText: {
    color: '#FECDD3',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeActivo: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  badgeActivoText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '800',
  },
  championBox: {
    marginVertical: 12,
    backgroundColor: '#272010',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  championIcon: {
    fontSize: 28,
  },
  championTextBox: {
    flex: 1,
  },
  championTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 1,
  },
  championName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  cancelledBox: {
    marginVertical: 12,
    backgroundColor: '#2D1217',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BE123C',
  },
  cancelledTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FB7185',
    letterSpacing: 1,
  },
  cancelledSub: {
    fontSize: 12,
    color: '#F1F5F9',
    marginTop: 3,
  },
  bannerDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  bannerDetailItem: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bannerDetailHighlight: {
    color: '#E2E8F0',
    fontWeight: '700',
  },
  fixtureSectionHeader: {
    marginBottom: 14,
  },
  fixtureSectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 1.2,
  },
  fixtureSectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  bracketContainer: {
    gap: 16,
    marginBottom: 20,
  },
  matchCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  phaseBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  phaseBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  pendingBadge: {
    backgroundColor: '#451A03',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  pendingBadgeText: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '800',
  },
  finishedBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
  },
  finishedBadgeText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '800',
  },
  directPassBadge: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  directPassText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '800',
  },
  matchBody: {
    padding: 16,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  teamRowWinner: {
    backgroundColor: '#0F2844',
  },
  teamNameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  teamDotNormal: {
    backgroundColor: '#64748B',
  },
  teamDotWinner: {
    backgroundColor: '#38BDF8',
  },
  teamDotPass: {
    backgroundColor: '#A855F7',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    flex: 1,
  },
  teamNameWinner: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  teamNamePass: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  winnerBadgeSmall: {
    backgroundColor: '#0284C7',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  scoreBadge: {
    width: 40,
    height: 34,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBadgeWinner: {
    backgroundColor: '#1E3A8A',
    borderColor: '#38BDF8',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94A3B8',
  },
  scoreTextWinner: {
    color: '#FFFFFF',
  },
  vsSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  vsText: {
    marginHorizontal: 10,
    fontSize: 10,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 1,
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  footerNote: {
    fontSize: 11,
    color: '#93C5FD',
    fontWeight: '600',
  },
  footerWinner: {
    fontSize: 11,
    color: '#94A3B8',
  },
  footerWinnerName: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  footerPending: {
    fontSize: 11,
    color: '#FCD34D',
    fontWeight: '600',
  },
  equiposCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  equiposTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 1,
    marginBottom: 12,
  },
  equiposGrid: {
    gap: 8,
  },
  equipoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  equipoIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    color: '#38BDF8',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 11,
    fontWeight: '800',
    marginRight: 10,
  },
  equipoInfo: {
    flex: 1,
  },
  equipoNombreText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  equipoRepText: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 1,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingBoxText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 12,
  },
  emptyContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
});
