import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../../core/http/http-error';
import {
  createService,
  deleteService,
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
    if (!providerId) {
      return;
    }

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
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const updateField = (fieldName, value) => {
    setFormValues((current) => ({
      ...current,
      [fieldName]: value,
    }));
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

    setIsSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      const servicePayload = {
        titulo: formValues.titulo,
        descricao: formValues.descricao,
        preco: price,
        duracao_padrao: duration,
        id_categoria: categoryId,
      };

      if (editingServiceId) {
        await updateService(editingServiceId, servicePayload, token);
      } else {
        await createService({
          ...servicePayload,
          id_prestador: Number.parseInt(providerId, 10),
        }, token);
      }

      setFormValues(INITIAL_FORM);
      setEditingServiceId(null);
      setFeedbackMessage(editingServiceId ? 'Serviço atualizado com sucesso.' : 'Serviço cadastrado com sucesso.');
      await loadData();
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível cadastrar o serviço.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeService = async (serviceId) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      await deleteService(serviceId, token);
      setFeedbackMessage('Serviço arquivado. Agendamentos existentes foram preservados.');
      await loadData();
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível remover o serviço.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const editService = (service) => {
    setEditingServiceId(service.id_servico || service.id);
    setFormValues({
      titulo: service.titulo || '',
      descricao: service.descricao || '',
      preco: String(service.preco ?? ''),
      duracao_padrao: String(service.duracao_padrao || 60),
      id_categoria: String(service.id_categoria || service.categoria?.id_categoria || ''),
    });
  };

  const toggleService = async (service) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      await updateService(service.id_servico || service.id, { ativo: !service.ativo }, token);
      setFeedbackMessage(service.ativo ? 'Serviço pausado.' : 'Serviço publicado.');
      await loadData();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível atualizar o serviço.'));
    } finally {
      setIsSubmitting(false);
    }
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
    updateField,
  };
}
