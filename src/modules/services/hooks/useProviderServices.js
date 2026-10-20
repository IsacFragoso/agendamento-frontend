import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../../core/http/http-error';
import {
  createService,
  listCategories,
  listProviderServices,
  updateService,
} from '../services/services.service';

const INITIAL_FORM = {
  titulo: '',
  descricao: '',
  preco: '',
  duracao_padrao: '60',
  id_categoria: '',
};

const getServiceId = (service) => service.id_servico || service.id;

export function useProviderServices({ providerId, token }) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [editingServiceId, setEditingServiceId] = useState(null);

  const loadData = useCallback(async () => {
    if (!providerId) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const [servicePayload, categoryPayload] = await Promise.all([
        listProviderServices(providerId),
        listCategories(),
      ]);
      setServices(Array.isArray(servicePayload) ? servicePayload : []);
      setCategories(Array.isArray(categoryPayload) ? categoryPayload : []);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível carregar os serviços do prestador.'));
      setServices([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const updateField = (fieldName, value) => {
    setFormValues((current) => ({ ...current, [fieldName]: value }));
  };

  const updateServiceRecord = async (serviceId, payload) => {
    const previousService = services.find((service) => getServiceId(service) === serviceId);
    if (!previousService) {
      return { succeeded: false, errorMessage: 'Não foi possível encontrar esse serviço.' };
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');
    setServices((current) => current.map((service) => (
      getServiceId(service) === serviceId ? { ...service, ...payload } : service
    )));

    try {
      const updatedService = await updateService(serviceId, payload, token);
      setServices((current) => current.map((service) => (
        getServiceId(service) === serviceId ? { ...service, ...updatedService } : service
      )));
      return { succeeded: true };
    } catch (error) {
      const message = getErrorMessage(error, 'Não foi possível atualizar o serviço.');
      setServices((current) => current.map((service) => (
        getServiceId(service) === serviceId ? previousService : service
      )));
      setErrorMessage(message);
      return { succeeded: false, errorMessage: message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitService = async (event) => {
    event.preventDefault();
    const price = Number.parseFloat(formValues.preco);
    const duration = Number.parseInt(formValues.duracao_padrao, 10);
    const categoryId = Number.parseInt(formValues.id_categoria, 10);

    if (Number.isNaN(price)) {
      setErrorMessage('Informe um preço válido.');
      return false;
    }
    if (Number.isNaN(duration) || Number.isNaN(categoryId)) {
      setErrorMessage('Preencha duração e categoria corretamente.');
      return false;
    }

    setErrorMessage('');
    setFeedbackMessage('');
    const servicePayload = {
      titulo: formValues.titulo.trim(),
      descricao: formValues.descricao.trim(),
      preco: price,
      duracao_padrao: duration,
      id_categoria: categoryId,
    };

    if (editingServiceId) {
      const result = await updateServiceRecord(editingServiceId, servicePayload);
      if (!result.succeeded) return false;
    } else {
      setIsSubmitting(true);
      try {
        await createService({
          ...servicePayload,
          id_prestador: Number.parseInt(providerId, 10),
        }, token);
        await loadData();
      } catch (error) {
        setErrorMessage(getErrorMessage(error, 'Não foi possível cadastrar o serviço.'));
        return false;
      } finally {
        setIsSubmitting(false);
      }
    }

    setFormValues(INITIAL_FORM);
    setEditingServiceId(null);
    setFeedbackMessage(editingServiceId ? 'Serviço atualizado com sucesso.' : 'Serviço cadastrado com sucesso.');
    return true;
  };

  const removeService = async (serviceId) => {
    const result = await updateServiceRecord(serviceId, { ativo: false });
    if (result.succeeded) setFeedbackMessage('Serviço arquivado. Agendamentos existentes foram preservados.');
    return result.succeeded;
  };

  const editService = (service) => {
    setEditingServiceId(getServiceId(service));
    setFormValues({
      titulo: service.titulo || '',
      descricao: service.descricao || '',
      preco: String(service.preco ?? ''),
      duracao_padrao: String(service.duracao_padrao || 60),
      id_categoria: String(service.id_categoria || service.categoria?.id_categoria || ''),
    });
  };

  const toggleService = async (service) => {
    const result = await updateServiceRecord(getServiceId(service), { ativo: !service.ativo });
    if (result.succeeded) setFeedbackMessage(service.ativo ? 'Serviço pausado.' : 'Serviço publicado.');
    return result.succeeded;
  };

  const cancelEditing = () => {
    setEditingServiceId(null);
    setFormValues(INITIAL_FORM);
  };

  return {
    categories,
    errorMessage,
    editingServiceId,
    feedbackMessage,
    formValues,
    isLoading,
    isSubmitting,
    services,
    loadData,
    removeService,
    editService,
    toggleService,
    cancelEditing,
    submitService,
    updateServiceRecord,
    updateField,
  };
}