import React from 'react';
import { cn } from './cn';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { Check, Sparkles } from 'lucide-react';

export interface PriceCardFeature {
  text: string;
  included?: boolean;
}

export interface PriceCardProps {
  name: string;
  description: string;
  priceFormatted: string;
  periodLabel?: string;
  creditsLabel: string;
  features: (string | PriceCardFeature)[];
  buttonText?: string;
  onSelect?: () => void;
  isPopular?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const PriceCard: React.FC<PriceCardProps> = ({
  name,
  description,
  priceFormatted,
  periodLabel = '/mês',
  creditsLabel,
  features,
  buttonText = 'Começar Agora',
  onSelect,
  isPopular = false,
  isLoading = false,
  disabled = false,
  className,
}) => {
  return (
    <Card
      className={cn(
        'relative flex flex-col justify-between p-6 rounded-2xl transition-all duration-200',
        isPopular
          ? 'border-primary ring-1 ring-primary/40 shadow-lg shadow-primary/5 bg-card'
          : 'border-border/80 bg-card/60',
        className
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default" size="md" className="bg-primary text-white font-bold shadow-xs">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Mais Escolhido
          </Badge>
        </div>
      )}

      <div>
        <div className="space-y-1 mb-4">
          <h4 className="text-xl font-bold text-foreground">{name}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed min-h-[32px]">
            {description}
          </p>
        </div>

        <div className="my-6 space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-foreground font-mono">{priceFormatted}</span>
            {periodLabel && (
              <span className="text-xs text-muted-foreground font-medium">{periodLabel}</span>
            )}
          </div>
          <div className="inline-block mt-2">
            <Badge variant="gold" size="sm">
              {creditsLabel}
            </Badge>
          </div>
        </div>

        <div className="h-px bg-border/60 my-6" />

        <ul className="space-y-3 mb-8" aria-label={`Vantagens do plano ${name}`}>
          {features.map((feature, idx) => {
            const isObj = typeof feature === 'object';
            const text = isObj ? feature.text : feature;
            const included = isObj ? feature.included ?? true : true;

            return (
              <li
                key={idx}
                className={cn(
                  'flex items-start gap-2.5 text-xs',
                  included ? 'text-foreground font-medium' : 'text-muted-foreground/50 line-through'
                )}
              >
                <div
                  className={cn(
                    'h-4 w-4 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                    included
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-muted text-muted-foreground/40'
                  )}
                >
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span>{text}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <Button
        variant={isPopular ? 'primary' : 'outline'}
        size="lg"
        fullWidth
        isLoading={isLoading}
        disabled={disabled}
        onClick={onSelect}
      >
        {buttonText}
      </Button>
    </Card>
  );
};
