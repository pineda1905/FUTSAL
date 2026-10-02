import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Linking,
  RefreshControl,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import axios from 'axios';

// Configuración de idioma español para react-native-calendars
LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  monthNamesShort: [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ],
  dayNames: [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

// Función para convertir Date a 'YYYY-MM-DD'
const toDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function ReservasScreen({ navigation }) {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [activeTorneo, setActiveTorneo] = useState(null);

  // 1. Fecha actual del celular
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toDateString(today), [today]);

  // 2. Límite de 10 días a partir de hoy
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + 10);
    return d;
  }, [today]);
  const maxDateStr = useMemo(() => toDateString(maxDate), [maxDate]);

  // 3. Cargar reservas y torneos activos del backend
  const fetchReservas = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await axios.get(
        'https://futsal-k08n.onrender.com/api/reservas',
        { timeout: 8000 }
      );
      if (Array.isArray(response.data)) {
        setReservas(response.data);
      } else {
        setReservas([]);
      }
    } catch (error) {
      console.warn('Backend Reservas:', error.message);
      setReservas([]);
    }

    try {
      const resTorneos = await axios.get(
        'https://futsal-k08n.onrender.com/api/torneos',
        { timeout: 8000 }
      );
      if (Array.isArray(resTorneos.data) && resTorneos.data.length > 0) {
        // Tomar el torneo más reciente
        setActiveTorneo(resTorneos.data[resTorneos.data.length - 1]);
      }
    } catch (error) {
      console.warn('Backend Torneo Activo:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReservas(false);
      if (!selectedDate) setSelectedDate(todayStr);
    }, [fetchReservas, todayStr, selectedDate])
  );

  useEffect(() => {
    fetchReservas(false);
    setSelectedDate(todayStr);
    const interval = setInterval(() => {
      fetchReservas(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchReservas, todayStr]);

  // Conjunto de fechas con reservas ocupadas
  const occupiedDateSet = useMemo(() => {
    const set = new Set();
    reservas.forEach((res) => {
      const fechaInicio = res.fechaHoraInicio || res.FechaHoraInicio;
      const estado = res.nombreEstado || res.NombreEstado || '';
      if (fechaInicio && !estado.toLowerCase().includes('cancelad')) {
        const dStr = fechaInicio.split('T')[0];
        set.add(dStr);
      }
    });
    return set;
  }, [reservas]);

  // Calendario con marcas y días desactivados
  const markedDates = useMemo(() => {
    const marks = {};

    // Días pasados desactivados
    const pastStart = new Date(today);
    pastStart.setDate(today.getDate() - 35);
    for (let d = new Date(pastStart); d < today; d.setDate(d.getDate() + 1)) {
      const ds = toDateString(d);
      marks[ds] = {
        disabled: true,
        disableTouchEvent: false,
        textColor: '#334155',
      };
    }

    // Días a más de 10 días en el futuro desactivados
    const futureEnd = new Date(maxDate);
    futureEnd.setDate(maxDate.getDate() + 60);
    for (let d = new Date(maxDate); d <= futureEnd; d.setDate(d.getDate() + 1)) {
      const ds = toDateString(d);
      if (ds > maxDateStr) {
        marks[ds] = {
          disabled: true,
          disableTouchEvent: false,
          textColor: '#334155',
        };
      }
    }

    // Días válidos dentro de la regla de los 10 días
    for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const ds = toDateString(d);
      const isOccupied = occupiedDateSet.has(ds);

      marks[ds] = {
        disabled: false,
        disableTouchEvent: false,
        textColor: isOccupied ? '#FCA5A5' : '#F8FAFC',
        marked: isOccupied,
        dotColor: isOccupied ? '#EF4444' : undefined,
      };
    }

    // Día seleccionado actualmente
    if (selectedDate) {
      const isOccupied = occupiedDateSet.has(selectedDate);
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: isOccupied ? '#991B1B' : '#2563EB',
        selectedTextColor: '#FFFFFF',
      };
    }

    return marks;
  }, [today, maxDate, maxDateStr, todayStr, occupiedDateSet, selectedDate]);

  // Tap en día del calendario
  const handleDayPress = (day) => {
    const dateStr = day.dateString;
    const isBeyond10Days = dateStr > maxDateStr;
    const isPast = dateStr < todayStr;
    const isOccupied = occupiedDateSet.has(dateStr);

    if (isBeyond10Days || isPast || isOccupied) {
      Alert.alert(
        'Aviso de Reserva',
        'Las reservas están limitadas a un máximo de 10 días de anticipación. Requisitos: Zapatos de suela lisa, pago previo del 50%',
        [
          { text: 'Entendido', style: 'default' },
          {
            text: 'Consultar por WhatsApp',
            onPress: () => abrirWhatsApp(dateStr),
          },
        ]
      );
      return;
    }

    setSelectedDate(dateStr);
  };

  // Reservas activas del día seleccionado
  const reservasDelDia = useMemo(() => {
    if (!selectedDate) return [];
    return reservas.filter((res) => {
      const fecha = res.fechaHoraInicio || res.FechaHoraInicio;
      return fecha && fecha.startsWith(selectedDate);
    });
  }, [reservas, selectedDate]);

  // Fecha legible
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return 'Ningún día seleccionado';
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return selectedDate;
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  // REDIRECCIÓN A WHATSAPP
  const abrirWhatsApp = async (fechaParam) => {
    const fechaAUsar = fechaParam || selectedDate;
    const isOccupied = occupiedDateSet.has(fechaAUsar);
    const telefono = '50370000001';

    let mensaje = `¡Hola FutsalPro! Quisiera solicitar la reserva de una cancha para la fecha: ${fechaAUsar}.\n\n✅ Comprendo los requisitos:\n- Calzado de suela lisa obligatorio.\n- Pago previo del 50% de anticipo.\n\n¿Qué horarios o canchas tienen disponibles?`;

    if (isOccupied) {
      mensaje = `¡Hola FutsalPro! Veo que para el ${fechaAUsar} hay turnos reservados. Quisiera consultar si tienen otra cancha o franja horaria disponible ese día o fecha cercana.`;
    }

    const encoded = encodeURIComponent(mensaje);
    const urlApp = `whatsapp://send?phone=${telefono}&text=${encoded}`;
    const urlWeb = `https://wa.me/${telefono}?text=${encoded}`;

    try {
      const supported = await Linking.canOpenURL(urlApp);
      if (supported) {
        await Linking.openURL(urlApp);
      } else {
        await Linking.openURL(urlWeb);
      }
    } catch (err) {
      Linking.openURL(urlWeb).catch(() => {
        Alert.alert(
          'Contacto FutsalPro',
          `No se pudo abrir WhatsApp automáticamente.\nPuedes contactarnos directamente al teléfono: +503 7000-0001.`
        );
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header superior */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.brandTitle}>FUTSALPRO</Text>
          <Text style={styles.subTitle}>Reservas de Canchas Deportivas</Text>
        </View>
        <TouchableOpacity
          onPress={fetchReservas}
          style={styles.refreshButton}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#38BDF8" />
          ) : (
            <Text style={styles.refreshButtonText}>↻ Recargar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Barra de acceso rápido entre Pestañas */}
      <View style={styles.topSegmentContainer}>
        <View style={[styles.segmentBtn, styles.segmentBtnActive]}>
          <Text style={styles.segmentTextActive}>📅 Reservas</Text>
        </View>
        <TouchableOpacity
          style={styles.segmentBtn}
          onPress={() => navigation?.navigate('Torneos')}
          activeOpacity={0.7}
        >
          <Text style={styles.segmentText}>🏆 Ver Torneos y Resultados ➔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchReservas(true)}
            tintColor="#38BDF8"
            colors={['#38BDF8']}
          />
        }
      >
        {/* Banner dinámico hacia Torneo en Vivo */}
        <TouchableOpacity
          style={styles.bannerTorneos}
          onPress={() =>
            navigation?.navigate('Torneos', {
              torneoId: activeTorneo?.id,
            })
          }
          activeOpacity={0.85}
        >
          <View style={styles.bannerTorneosLeft}>
            <View style={styles.liveTagRow}>
              <View style={styles.liveTagDot} />
              <Text style={styles.liveTagText}>TORNEO EN VIVO</Text>
            </View>
            <Text style={styles.bannerTorneosTitle}>
              {activeTorneo?.nombre || 'Copa Relámpago Apertura'}
            </Text>
            <Text style={styles.bannerTorneosSubtitle}>
              {activeTorneo
                ? `${activeTorneo.rangoEdad} • ${activeTorneo.equipos?.length || 0} equipos (Ver llaves y resultados ➔)`
                : 'Toca aquí para ver las llaves de Cuartos de Final y marcadores'}
            </Text>
          </View>
          <View style={styles.bannerTorneosArrow}>
            <Text style={styles.bannerArrowText}>➔</Text>
          </View>
        </TouchableOpacity>

        {/* Calendario visual con tema oscuro */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={todayStr}
            minDate={todayStr}
            maxDate={maxDateStr}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={{
              backgroundColor: '#1E293B',
              calendarBackground: '#1E293B',
              textSectionTitleColor: '#94A3B8',
              selectedDayBackgroundColor: '#2563EB',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#38BDF8',
              dayTextColor: '#F8FAFC',
              textDisabledColor: '#334155',
              arrowColor: '#38BDF8',
              monthTextColor: '#F8FAFC',
              indicatorColor: '#38BDF8',
              textDayFontWeight: '600',
              textMonthFontWeight: '800',
              textDayHeaderFontWeight: '700',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={styles.calendarStyle}
          />
        </View>

        {/* Leyenda explicativa */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
            <Text style={styles.legendText}>Seleccionado</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Con Reservas</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#334155' }]} />
            <Text style={styles.legendText}>Bloqueado (+10 días)</Text>
          </View>
        </View>

        {/* Reglas de Reserva */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Reglamento Oficial de Reserva</Text>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleBullet}>•</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleHighlight}>Ventana de Anticipación:</Text> Máximo 10 días futuros desde hoy.
            </Text>
          </View>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleBullet}>•</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleHighlight}>Duración de Turnos:</Text> Bloques de 1 a 4 horas consecutivas.
            </Text>
          </View>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleBullet}>•</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleHighlight}>Requisitos Obligatorios:</Text> Calzado deportivo con suela lisa y anticipo del 50%.
            </Text>
          </View>
        </View>

        {/* Detalle del Día Seleccionado y Botón de WhatsApp */}
        <View style={styles.dayDetailsCard}>
          <Text style={styles.dayDetailsHeader}>Día Seleccionado</Text>
          <Text style={styles.dayDetailsDate}>{formattedSelectedDate}</Text>

          {occupiedDateSet.has(selectedDate) ? (
            <View style={styles.occupiedAlertBox}>
              <Text style={styles.occupiedAlertText}>
                ⚠️ Este día ya cuenta con reservas registradas.
              </Text>
            </View>
          ) : (
            <View style={styles.availableBox}>
              <Text style={styles.availableText}>
                ✓ Día disponible para solicitar tu turno.
              </Text>
            </View>
          )}

          {/* Listado de turnos reservados si existen */}
          {reservasDelDia.length > 0 && (
            <View style={styles.reservationsList}>
              <Text style={styles.reservationsListTitle}>Turnos reservados para esta fecha:</Text>
              {reservasDelDia.map((item, index) => {
                const cancha = item.nombreCancha || item.NombreCancha || 'Cancha Pro';
                const horaInicio = item.fechaHoraInicio || item.FechaHoraInicio;
                const horaFin = item.fechaHoraFin || item.FechaHoraFin;

                return (
                  <View key={item.id ?? index} style={styles.reservationItem}>
                    <Text style={styles.resCancha}>{cancha}</Text>
                    <Text style={styles.resTime}>
                      {horaInicio ? new Date(horaInicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''} -{' '}
                      {horaFin ? new Date(horaFin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* BOTÓN OFICIAL DE REDIRECCIÓN A WHATSAPP */}
          <TouchableOpacity
            style={[
              styles.whatsappButton,
              occupiedDateSet.has(selectedDate) && styles.whatsappButtonWarning,
            ]}
            activeOpacity={0.85}
            onPress={() => abrirWhatsApp()}
          >
            <Text style={styles.whatsappIcon}>💬</Text>
            <View style={styles.whatsappTextContainer}>
              <Text style={styles.whatsappMainText}>
                {occupiedDateSet.has(selectedDate)
                  ? 'Consultar Disponibilidad por WhatsApp'
                  : 'Reservar Turno por WhatsApp'}
              </Text>
              <Text style={styles.whatsappSubText}>
                Redirige a chat directo con FutsalPro (+503 7000-0001)
              </Text>
            </View>
          </TouchableOpacity>
        </View>
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
  scrollView: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerTorneos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  bannerTorneosLeft: {
    flex: 1,
    paddingRight: 10,
  },
  liveTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveTagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#86EFAC',
    letterSpacing: 1,
  },
  bannerTorneosTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerTorneosSubtitle: {
    fontSize: 11,
    color: '#BAE6FD',
    marginTop: 2,
  },
  bannerTorneosArrow: {
    backgroundColor: '#2563EB',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  bannerArrowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  calendarContainer: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  calendarStyle: {
    borderRadius: 20,
    paddingBottom: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  rulesCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rulesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  ruleBullet: {
    color: '#38BDF8',
    fontSize: 14,
    marginRight: 6,
    lineHeight: 18,
  },
  ruleText: {
    color: '#CBD5E1',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  ruleHighlight: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  dayDetailsCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dayDetailsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dayDetailsDate: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  availableBox: {
    backgroundColor: '#064E3B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#059669',
  },
  availableText: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '600',
  },
  occupiedAlertBox: {
    backgroundColor: '#450A0A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  occupiedAlertText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },
  reservationsList: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  reservationsListTitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 8,
  },
  reservationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resCancha: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  resTime: {
    color: '#94A3B8',
    fontSize: 12,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#22C55E',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsappButtonWarning: {
    backgroundColor: '#047857',
    borderColor: '#10B981',
  },
  whatsappIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  whatsappTextContainer: {
    flex: 1,
  },
  whatsappMainText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  whatsappSubText: {
    color: '#D1FAE5',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
