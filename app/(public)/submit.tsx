import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InputField } from '@/components/InputField';
import { SelectSheet } from '@/components/SelectSheet';
import { StepHeader, Stepper } from '@/components/Stepper';
import {
  useChiefdoms,
  useDistricts,
  useGrievanceTypes,
  useHowReported,
  useLocalities,
  useOrganisations,
  useProgrammes,
  useRegions,
  useSections,
} from '@/hooks/useReference';
import { useSubmitGrievance } from '@/hooks/useSubmitGrievance';

interface FormState {
  summary: string;
  description: string;
  grievance_type_id: number | null;
  how_reported_id: number | null;
  implementing_organization_id: number | null;
  programme_id: number | null;
  region_id: number | null;
  district_id: number | null;
  chiefdom_id: number | null;
  section_id: number | null;
  locality_id: number | null;
  is_anonymous: boolean;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
}

const INITIAL: FormState = {
  summary: '',
  description: '',
  grievance_type_id: null,
  how_reported_id: null,
  implementing_organization_id: null,
  programme_id: null,
  region_id: null, district_id: null, chiefdom_id: null, section_id: null, locality_id: null,
  is_anonymous: true,
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  address: '',
};

const TOTAL_STEPS = 4;

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function Submit() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const submit = useSubmitGrievance();

  const types = useGrievanceTypes();
  const howReported = useHowReported();
  const orgs = useOrganisations();
  const programmes = useProgrammes(form.implementing_organization_id);

  const regions = useRegions();
  const districts = useDistricts(form.region_id);
  const chiefdoms = useChiefdoms(form.district_id);
  const sections = useSections(form.chiefdom_id);
  const localities = useLocalities(form.section_id);

  function patch(k: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...k }));
    // Clear any errors for the fields being edited.
    const touched = Object.keys(k) as (keyof FormState)[];
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of touched) delete next[key];
      return next;
    });
  }

  /** Validate the current step. Returns plain-language message for first error (for the Alert), or null when valid. */
  function validateStep(): string | null {
    const e: FormErrors = {};
    let firstMessage: string | null = null;

    if (step === 0) {
      if (!form.summary.trim()) {
        e.summary = 'Add a short title.';
        firstMessage ??= 'Please add a short title for your grievance before continuing.';
      }
      if (form.grievance_type_id === null) {
        e.grievance_type_id = 'Pick one.';
        firstMessage ??= 'Please pick the grievance type before continuing.';
      }
    } else if (step === 2 && !form.is_anonymous) {
      const hasAny =
        form.first_name.trim() || form.phone_number.trim() || form.email.trim();
      if (!hasAny) {
        e.first_name = 'Add a name, phone or email.';
        e.phone_number = 'Add a name, phone or email.';
        e.email = 'Add a name, phone or email.';
        firstMessage ??=
          'Please add at least one contact — a name, phone, or email — or switch on "Submit anonymously".';
      }
    }

    setErrors(e);
    return firstMessage;
  }

  function next() {
    const msg = validateStep();
    if (msg) {
      Alert.alert('Missing information', msg);
      return;
    }
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else onSubmit();
  }

  function back() {
    if (step === 0) router.back();
    else setStep((s) => s - 1);
  }

  async function onSubmit() {
    submit.mutate(
      {
        summary: form.summary.trim(),
        description: form.description.trim() || undefined,
        grievance_type_id: form.grievance_type_id!,
        how_reported_id: form.how_reported_id,
        implementing_organization_id: form.implementing_organization_id,
        programme_id: form.programme_id,
        region_id: form.region_id,
        district_id: form.district_id,
        chiefdom_id: form.chiefdom_id,
        section_id: form.section_id,
        locality_id: form.locality_id,
        is_anonymous: form.is_anonymous,
        complainer: form.is_anonymous ? undefined : {
          first_name: form.first_name.trim() || undefined,
          last_name: form.last_name.trim() || undefined,
          email: form.email.trim() || undefined,
          phone_number: form.phone_number.trim() || undefined,
          address: form.address.trim() || undefined,
        },
      },
      {
        onSuccess: (result) => {
          router.replace({ pathname: '/(public)/submit-success', params: { ref: result.grm_number } });
        },
        onError: (err: any) => {
          const serverMessage: string | undefined = err?.response?.data?.message;
          const message = serverMessage
            ? serverMessage
            : 'Your form is still filled in. Tap Submit again when you have a better signal.';
          Alert.alert('Could not submit', message);
        },
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-navy">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="px-6 pt-2">
          <Pressable onPress={back} className="flex-row items-center gap-2 mb-4 py-2">
            <Ionicons name="chevron-back" size={20} color="#e8c97a" />
            <Text className="text-gold-light text-sm">{step === 0 ? 'Cancel' : 'Back'}</Text>
          </Pressable>
          <Stepper current={step} total={TOTAL_STEPS} />
        </View>

        <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 24 }}>
          {step === 0 ? (
            <StepAbout
              form={form}
              patch={patch}
              errors={errors}
              types={types.data ?? []}
              typesLoading={types.isLoading}
              howReported={howReported.data ?? []}
              howReportedLoading={howReported.isLoading}
              orgs={orgs.data ?? []}
              orgsLoading={orgs.isLoading}
              programmes={programmes.data ?? []}
              programmesLoading={programmes.isLoading}
            />
          ) : null}

          {step === 1 ? (
            <StepLocation
              form={form}
              patch={patch}
              regions={regions.data ?? []}
              districts={districts.data ?? []}
              chiefdoms={chiefdoms.data ?? []}
              sections={sections.data ?? []}
              localities={localities.data ?? []}
            />
          ) : null}

          {step === 2 ? <StepContact form={form} patch={patch} errors={errors} /> : null}

          {step === 3 ? (
            <StepReview
              form={form}
              types={types.data ?? []}
              orgs={orgs.data ?? []}
              programmes={programmes.data ?? []}
              regions={regions.data ?? []}
              districts={districts.data ?? []}
              chiefdoms={chiefdoms.data ?? []}
              sections={sections.data ?? []}
              localities={localities.data ?? []}
            />
          ) : null}
        </ScrollView>

        <View className="px-6 pb-6 pt-2 border-t border-white/10 bg-navy">
          <Pressable
            onPress={next}
            disabled={submit.isPending}
            className="bg-gold rounded-xl py-4 items-center flex-row justify-center gap-2 disabled:opacity-50"
          >
            {submit.isPending ? (
              <ActivityIndicator color="#0f2044" />
            ) : (
              <>
                <Text className="text-navy font-bold text-base">
                  {step < TOTAL_STEPS - 1 ? 'Next' : 'Submit grievance'}
                </Text>
                <Ionicons name={step < TOTAL_STEPS - 1 ? 'arrow-forward' : 'checkmark'} size={18} color="#0f2044" />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Step 1 — About ───────────────────────────────────────────────────────

function StepAbout({ form, patch, errors, types, typesLoading, howReported, howReportedLoading, orgs, orgsLoading, programmes, programmesLoading }: any) {
  return (
    <>
      <StepHeader step={0} total={TOTAL_STEPS} title="About the grievance" subtitle="A short title plus details." />

      <View className="gap-3">
        <InputField
          label="Summary *"
          value={form.summary}
          onChangeText={(v: string) => patch({ summary: v })}
          placeholder="Short title"
          maxLength={500}
          error={errors?.summary}
        />

        <InputField
          label="Description"
          value={form.description}
          onChangeText={(v: string) => patch({ description: v })}
          placeholder="What happened? When? Who was involved?"
          multiline
          maxLength={10000}
        />

        <SelectSheet
          label="Grievance type *"
          placeholder="Pick one"
          items={types}
          loading={typesLoading}
          value={form.grievance_type_id}
          onChange={(id) => patch({ grievance_type_id: id })}
          clearable={false}
          error={errors?.grievance_type_id}
        />

        <SelectSheet
          label="How did you report this?"
          placeholder="Optional"
          items={howReported}
          loading={howReportedLoading}
          value={form.how_reported_id}
          onChange={(id) => patch({ how_reported_id: id })}
          selectionStyle="chips"
        />

        <SelectSheet
          label="Implementing organisation"
          placeholder="Optional"
          items={orgs}
          loading={orgsLoading}
          value={form.implementing_organization_id}
          onChange={(id) => patch({ implementing_organization_id: id, programme_id: null })}
        />

        {form.implementing_organization_id ? (
          <SelectSheet
            label="Programme / project"
            placeholder="Optional"
            items={programmes}
            loading={programmesLoading}
            value={form.programme_id}
            onChange={(id) => patch({ programme_id: id })}
          />
        ) : null}
      </View>
    </>
  );
}

// ─── Step 2 — Location ─────────────────────────────────────────────────────

function StepLocation({ form, patch, regions, districts, chiefdoms, sections, localities }: any) {
  return (
    <>
      <StepHeader step={1} total={TOTAL_STEPS} title="Where did it happen?" subtitle="Optional, but helps us route your case faster." />
      <View className="gap-3">
        <SelectSheet
          label="Region"
          placeholder="Pick a region"
          items={regions}
          value={form.region_id}
          onChange={(id) => patch({ region_id: id, district_id: null, chiefdom_id: null, section_id: null, locality_id: null })}
        />
        <SelectSheet
          label="District"
          placeholder="Pick a district"
          items={districts}
          disabled={form.region_id === null}
          value={form.district_id}
          onChange={(id) => patch({ district_id: id, chiefdom_id: null, section_id: null, locality_id: null })}
        />
        <SelectSheet
          label="Chiefdom"
          placeholder="Pick a chiefdom"
          items={chiefdoms}
          disabled={form.district_id === null}
          value={form.chiefdom_id}
          onChange={(id) => patch({ chiefdom_id: id, section_id: null, locality_id: null })}
        />
        <SelectSheet
          label="Section"
          placeholder="Pick a section"
          items={sections}
          disabled={form.chiefdom_id === null}
          value={form.section_id}
          onChange={(id) => patch({ section_id: id, locality_id: null })}
        />
        <SelectSheet
          label="Locality"
          placeholder="Pick a locality"
          items={localities}
          disabled={form.section_id === null}
          value={form.locality_id}
          onChange={(id) => patch({ locality_id: id })}
        />
      </View>
    </>
  );
}

// ─── Step 3 — Contact ──────────────────────────────────────────────────────

function StepContact({ form, patch, errors }: any) {
  return (
    <>
      <StepHeader step={2} total={TOTAL_STEPS} title="Your contact details" subtitle="Optional. Officers can reach back via whichever channel you give us." />

      <View className="bg-white/10 border border-white/20 rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-white font-semibold">Submit anonymously</Text>
            <Text className="text-white/60 text-xs mt-0.5">
              Your name and contact stay hidden from the public case view.
            </Text>
          </View>
          <Switch
            value={form.is_anonymous}
            onValueChange={(v) => patch({ is_anonymous: v })}
            trackColor={{ false: '#475569', true: '#c9a84c' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {!form.is_anonymous ? (
        <View className="gap-3">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <InputField label="First name" value={form.first_name} onChangeText={(v: string) => patch({ first_name: v })} maxLength={100} error={errors?.first_name} />
            </View>
            <View className="flex-1">
              <InputField label="Last name" value={form.last_name} onChangeText={(v: string) => patch({ last_name: v })} maxLength={100} />
            </View>
          </View>
          <InputField label="Email" value={form.email} onChangeText={(v: string) => patch({ email: v })} keyboardType="email-address" autoCapitalize="none" maxLength={150} error={errors?.email} />
          <InputField label="Phone" value={form.phone_number} onChangeText={(v: string) => patch({ phone_number: v })} keyboardType="phone-pad" maxLength={30} error={errors?.phone_number} />
          <InputField label="Address" value={form.address} onChangeText={(v: string) => patch({ address: v })} multiline maxLength={500} />
        </View>
      ) : (
        <View className="bg-gold/10 border border-gold/30 rounded-xl p-4">
          <View className="flex-row gap-2">
            <Ionicons name="shield-checkmark" size={20} color="#c9a84c" />
            <Text className="text-gold-light text-sm flex-1">
              Your identity will be kept confidential. You can still track this case using the reference number you'll receive.
            </Text>
          </View>
        </View>
      )}
    </>
  );
}

// ─── Step 4 — Review ───────────────────────────────────────────────────────

function StepReview({ form, types, orgs, programmes, regions, districts, chiefdoms, sections, localities }: any) {
  const find = (arr: any[], id: number | null) => arr.find((x) => x.id === id)?.name ?? '—';

  return (
    <>
      <StepHeader step={3} total={TOTAL_STEPS} title="Review and submit" subtitle="Check the details below before submitting." />

      <View className="bg-white/5 rounded-xl p-4 gap-3">
        <Row k="Summary" v={form.summary || '—'} />
        {form.description ? <Row k="Description" v={form.description} /> : null}
        <Row k="Type" v={find(types, form.grievance_type_id)} />
        {form.implementing_organization_id ? <Row k="Organisation" v={find(orgs, form.implementing_organization_id)} /> : null}
        {form.programme_id ? <Row k="Programme" v={find(programmes, form.programme_id)} /> : null}
        {form.region_id ? <Row k="Region" v={find(regions, form.region_id)} /> : null}
        {form.district_id ? <Row k="District" v={find(districts, form.district_id)} /> : null}
        {form.chiefdom_id ? <Row k="Chiefdom" v={find(chiefdoms, form.chiefdom_id)} /> : null}
        {form.section_id ? <Row k="Section" v={find(sections, form.section_id)} /> : null}
        {form.locality_id ? <Row k="Locality" v={find(localities, form.locality_id)} /> : null}
        <Row k="Submitter" v={form.is_anonymous ? 'Anonymous' : `${form.first_name} ${form.last_name}`.trim() || 'Named (details below)'} />
      </View>

      <View className="bg-gold/10 border border-gold/30 rounded-xl p-4 mt-6">
        <Text className="text-gold-light text-xs leading-relaxed">
          By submitting, you consent to GRM processing this case. You'll receive a reference number you can use to check status.
        </Text>
      </View>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View>
      <Text className="text-white/50 text-xs uppercase tracking-wider">{k}</Text>
      <Text className="text-white text-sm mt-0.5">{v}</Text>
    </View>
  );
}
